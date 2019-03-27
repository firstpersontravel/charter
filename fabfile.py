import sys
import os
import time
import re
from functools import wraps
from cStringIO import StringIO

from termcolor import colored
from fabric.api import require, run, sudo, local, env, settings, hide, cd, \
    prefix, quiet, get
from fabric.contrib.files import put, upload_template
from fabric.contrib.console import confirm
from fabric.utils import puts
from fabric.decorators import roles, runs_once
from fabric.network import NetworkError

import boto.ec2
from jinja2 import Template

#######################################################
########## Global configuration #######################
#######################################################

AWS_REGION = 'us-west-2'
EC2_BOOTSTRAP_USER = 'ubuntu'
EC2_BOOTSTRAP_KEY = '~/.ssh/fpt2.pem'
EC2_BOOTSTRAP_USER_GROUP = 'dev'

EC2_PROJECT_NAME = 'galaxy'
EC2_DEPLOY_USER = 'deploy'

EC2_LAUNCH_SETTINGS = {
    'key_name': 'fpt2'
}
EC2_LAUNCH_OPTIONS = {
    # us-west-2 ubuntu 16.04 LTS hvm ebs-ssd
    'large': {'image_id': 'ami-ba602bc2', 'instance_type': 't2.medium'},
    'medium': {'image_id': 'ami-ba602bc2', 'instance_type': 't2.small'}
}
EBS_SIZE = 50  # GB

PROJECT_ROOT = os.path.dirname(__file__)
FAB_ROOT = os.path.join(os.path.dirname(__file__), 'deploy')
BOOTSTRAP_ROOT = os.path.join(FAB_ROOT, 'bootstrap')

GIT_REMOTE = 'git@github.com:gabesmed/agency-server.git'
KEEP_RELEASES = 5  # Keep this many releases

#######################################################
########## Basic configuration ########################
#######################################################

env.http_path = '/var/apps'
env.project_name = 'galaxy'
env.app_path = '%(http_path)s/%(project_name)s' % env
env.env_path = '%(app_path)s/env' % env
env.releases_path = '%(app_path)s/releases' % env
env.shared_path = '%(app_path)s/shared' % env
env.repo_path = '%(shared_path)s/cached-copy' % env
env.log_path = '%(app_path)s/log' % env
env.pid_path = '%(app_path)s/pid' % env
env.current_path = "%(app_path)s/current" % env
env.hq_path = "%(current_path)s/headquarters" % env
env.static_path = '%(current_path)s/static' % env

env.python = '%(env_path)s/bin/python' % env

env.user = EC2_DEPLOY_USER
env.group = EC2_BOOTSTRAP_USER_GROUP

env.key_filename = os.path.expanduser('~/.ssh/fpt2.pem')
env.forward_agent = True


def root():
    "Use root access to server."
    env._root = True
    env.user = EC2_BOOTSTRAP_USER
    env.key_filename = EC2_BOOTSTRAP_KEY

#######################################################
########## Stages #####################################
#######################################################


def confirm_on_production(func):
    @wraps(func)
    def decorated(*args, **kwargs):
        if env.stage == 'production' and not getattr(
                env, '_confirmed', None):
            if not confirm(
                    "Are you sure you want to do this on production?",
                    default=False):
                sys.exit()
            env._confirmed = True
        return func(*args, **kwargs)
    return decorated


def production():
    env.site_root = 'play.thegogame.com'
    env.stage = 'production'
    env.repo_branch = 'production'

    for instance, stage, role, host in get_hosts(env.stage):
        env.roledefs[role] = env.roledefs.get(role, [])
        env.roledefs[role].append(host)
    env.launchdefs = {
        'app': 'large',
        'worker': 'large',
    }
    env.instance_settings = {
        'app': {'security_groups': ['default']},
        'worker': {'security_groups': ['default']},
    }

def staging():
    env.site_root = 'test-play.thegogame.com'
    env.stage = 'staging'
    env.repo_branch = 'staging'

    for instance, stage, role, host in get_hosts(env.stage):
        env.roledefs[role] = env.roledefs.get(role, [])
        env.roledefs[role].append(host)
    env.launchdefs = {
        'app': 'medium',
        'worker': 'medium',
    }
    env.instance_settings = {
        'app': {'security_groups': ['default']},
        'worker': {'security_groups': ['default']},
    }

def merge_master():
    "Merge master branch into the branch for this stage, and push to github."
    merge('master')


def merge_hard(branch_name):
    "Reset stage branch to the last commit of the specified branch."
    merge(branch_name, True)


def merge(branch_name, hard=False):
    """
    Set stage branch to the last commit of the specified branch, then
    push to github.
    If hard is True, use reset --hard. Otherwise use a merge --ff-only.
    """

    # Check on right branch
    current_branch = os.popen('git symbolic-ref --short HEAD').read().strip()
    if current_branch != branch_name:
        sys.exit('On branch %s; should be on branch %s.' % (
            current_branch, branch_name))

    # Check working dir is clean
    git_status = os.popen('git status --porcelain').read().strip()
    if git_status:
        sys.exit('Working directory is not clean.')

    local('git checkout %(repo_branch)s' % env)
    if hard:
        local('git reset %s --hard' % branch_name)
    else:
        local('git merge --ff-only %s' % branch_name)
    local('git push' + (' -f' if hard else ''))
    local('git checkout %s' % current_branch)

#######################################################
########## Hosts file #################################
#######################################################

def _read_hosts():
    "Read hosts file from text file"
    hosts_filename = os.path.join(FAB_ROOT, 'hosts.txt')
    if not os.path.exists(hosts_filename):
        return
    with open(hosts_filename) as f:
        for i, line in enumerate(f.readlines()):
            if i <= 1:
                continue
            if line.strip().startswith('#'):
                continue
            items = filter(bool, re.split(r'\s*', line))
            instance, stage, role_names, host = items[:4]
            for role_name in filter(bool, role_names.split('-')):
                yield instance, stage, role_name, host


def get_hosts(stage=None, role=None):
    "Get hosts that match this stage and role."
    for instance, _stage, _role_name, host in _read_hosts():
        if stage is None or stage == _stage:
            if role is None or role == _role_name:
                yield instance, _stage, _role_name, host


def _list_hosts():
    "List all servers with current role."
    hosts = []
    conn = boto.ec2.connect_to_region(AWS_REGION)
    for reservation in conn.get_all_instances():
        for instance in reservation.instances:
            if instance.tags.get('Project') != EC2_PROJECT_NAME:
                continue
            if instance.state != 'running':
                continue
            name = instance.tags.get('Name', '')
            stage = instance.tags.get('Stage', '')
            role_names = instance.tags.get('Role').split(', ')
            for role_name in role_names:
                hosts.append({
                    'name': name,
                    'stage': stage,
                    'role': role_name,
                    'instance': instance.id,
                    'host': instance.public_dns_name
                })
    return hosts


def _print_hosts():
    hosts = _list_hosts()
    s = '%-10s   %-10s   %-10s   %-20s\n' % (
        'Instance', 'Stage', 'Role', 'Host')
    s += '%s\n' % ('-' * 80)
    for host in hosts:
        s += (
            "%(instance)-10s   %(stage)-10s   %(role)-10s   %(host)-20s\n" %
            host)
    return s


def print_hosts():
    "Print hosts."
    print(_print_hosts())
    

def save_hosts():
    "Save hosts file to text file."
    hosts = _print_hosts()
    print(hosts)
    with open(os.path.join(FAB_ROOT, 'hosts.txt'), 'w') as f:
        f.write(hosts)


#######################################################
########## Lifecycle Server ###########################
#######################################################

def create_host(*role_names):
    "Create a new server with specified roles."
    require('launchdefs', provided_by=[production, staging])
    if not role_names:
        print("Roles required.")
        sys.exit()
    if isinstance(role_names, basestring):
        role_names = [role_names]
    conn = boto.ec2.connect_to_region(AWS_REGION)
    instance_settings = dict(EC2_LAUNCH_SETTINGS)

    dev_sda1 = boto.ec2.blockdevicemapping.EBSBlockDeviceType()
    dev_sda1.size = EBS_SIZE  # size in GB
    mapping = boto.ec2.blockdevicemapping.BlockDeviceMapping()
    mapping['/dev/sda1'] = dev_sda1
    instance_settings['block_device_map'] = mapping

    for role_name in reversed(role_names):
        launchdef = env.launchdefs[role_name]
        instance_settings.update(EC2_LAUNCH_OPTIONS[launchdef])
        instance_settings.update(env.instance_settings[role_name])
    
    # Create bootstrap script.
    with open(os.path.join(FAB_ROOT, 'bootstrap', 'bootstrap.sh')) as f:
        bootstrap_template = f.read()
        context = {
            'PROJECT': EC2_PROJECT_NAME,
            'STAGE': env.stage,
            'ROLE': '-'.join(role_names),
            'USERGROUP': EC2_BOOTSTRAP_USER_GROUP
        }
        bootstrap_script = Template(bootstrap_template).render(context)
        instance_settings['user_data'] = bootstrap_script

    # Create instance and tag.
    puts('creating instance...')
    reservation = conn.run_instances(**instance_settings)
    instance = reservation.instances[0]
    puts('created %s' % instance.public_dns_name)
    while instance.state != 'running':
        puts("waiting for %s to start..." % instance.id)
        time.sleep(2)
        instance.update()
    instance.add_tag('Project', EC2_PROJECT_NAME)
    instance.add_tag('Stage', env.stage)
    instance.add_tag('Role', '-'.join(role_names))
    name = '%s-%s-%s-%s' % (
        EC2_PROJECT_NAME, env.stage, '-'.join(role_names), instance.id)
    instance.add_tag('Name', name)
    puts('created: %s' % instance.public_dns_name)

    # Set host to newly created server.
    root()
    env.host_string = instance.public_dns_name

    # Save hosts file.
    print('saving host...')
    save_hosts()

    print(colored(
        '***********\n'
        'Instance created! To complete if login hangs, run:\n'
        '$ fab -H %s %s root finalize_creation' % (
            instance.public_dns_name, env.stage), 'green'))
    print('')
    print('attempting login...')

    local('ssh-keyscan %s >> ~/.ssh/known_hosts' % instance.public_dns_name)

    # Make sure we can log in.
    while True:
        try:
            run('uname -s')
            break
        except NetworkError:
            time.sleep(10)

    finalize_creation()            


def finalize_creation():
    print('adding users...')
    add_users()
    print(colored(
        '***********\n'
        'Set up! To bootstrap instance, run:\n'
        '$ fab -H %s %s bootstrap\n' % (
        env.host_string, env.stage), 'green'))

def _get_users():
    "Get users that you should create."
    user_keys = {}
    with open(os.path.join(FAB_ROOT, 'users.txt')) as f:
        last_user_added = None
        for line in f.readlines():
            if not line.strip():
                # Blank lines separate users.
                last_user_added = None
                continue
            if not last_user_added:
                # Line is a username
                new_user = line.strip()
                user_keys[new_user] = []
                last_user_added = new_user
            else:
                # Line is a key
                user_keys[new_user].append(line)
    return user_keys


def add_users():
    "Add users to the given host."
    # Must be root.
    # require('_root', provided_by=root)
    user_keys = _get_users()
    print('adding users %s' % (', '.join(user_keys.keys())))
    for user, keys in user_keys.iteritems():
        _add_user(user, keys)


def _add_user(user, keys):
    "Add a user with keys to a given host."
    # Create user
    with settings(hide('warnings', 'stderr', 'stdout'), warn_only=True):
        sudo('groupadd %s' % EC2_BOOTSTRAP_USER_GROUP)
        sudo(
            'useradd %s -g %s -s /bin/bash -m' % (user,
            EC2_BOOTSTRAP_USER_GROUP))
        # Make ssh dir
        sudo('mkdir /home/%s/.ssh' % user)

        # Copy authorized keys
        authorized_keys = "".join(keys)
        put(
            StringIO(authorized_keys),
            '/home/%s/.ssh/authorized_keys' % user,
            use_sudo=True, mode=384)  # 0600

        # Copy bashrc
        put(os.path.join(BOOTSTRAP_ROOT, 'bashrc'), '/home/%s/.bashrc' % (
            user), use_sudo=True, mode=420)  # 0644

        # Set all files to correct owner.
        sudo('chown -R %s:%s /home/%s' % (
            user, EC2_BOOTSTRAP_USER_GROUP, user))
        
        sudo('ln -s %s /home/%s/log' % (env.log_path, user))
        sudo('ln -s %s /home/%s/env' % (env.env_path, user))
        sudo('ln -s %s /home/%s/shared' % (env.shared_path, user))
        sudo('ln -s %s /home/%s/current' % (env.current_path, user))
        sudo('ln -s %s /home/%s/%s' % (env.app_path, user, env.project_name))

#######################################################
########## Helpers  ###################################
#######################################################


virtualenv = lambda: prefix('source %(env_path)s/bin/activate' % env)


#######################################################
########## Bootstrap Server ###########################
#######################################################


def bootstrap():
    "From bare bones with just user files, get up and running."
    install_basics()
    install_packages()
    setup_file_structure()
    setup_virtualenv()
    download_repo()
    install_nginx()

    print(colored(
        'Instance bootstrapped! To launch the server, run:\n'
        '$ fab -H %s %s config_and_deploy' % (env.host_string, env.stage),
        'green'))


def install_basics():
    """
    Install basic software.
    """
    sudo('apt-get -y update')
    sudo('apt-get -y upgrade')
    sudo('apt-get -y install ntp')
    sudo('apt-get -y install build-essential python-dev autoconf')
    sudo('apt-get -y install python-setuptools git-core python-virtualenv')
    sudo('easy_install pip setuptools')

    # git lfs
    sudo('curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash')

    # mysql
    sudo('apt-get install -y mysql-client-5.7 libmysqlclient-dev')

    # for libmemcached
    sudo('apt-get install -y libmemcached-dev zlib1g-dev libssl-dev')

    # for crypto
    sudo('apt-get install -y libffi-dev')

    # for pil
    sudo('apt-get -y install libjpeg62 libjpeg62-dev zlib1g-dev libfreetype6 libfreetype6-dev python-imaging')
    with settings(warn_only=True):
        sudo(
            'ln -s /usr/lib/x86_64-linux-gnu/libz.so '
            '/usr/lib/libz.so')
        sudo(
            'ln -s /usr/lib/x86_64-linux-gnu/libjpeg.so '
            '/usr/lib/libjpeg.so')
        sudo(
            'ln -s /usr/lib/x86_64-linux-gnu/libfreetype.so '
            '/usr/lib/libfreetype.so')

    # for zipping files
    sudo('apt-get -y install zip unzip')


def install_packages():
    # yarn
    sudo('curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -')
    sudo('echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list')

    sudo('apt-get update')

    # node
    sudo('curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -')
    sudo('apt-get install -y nodejs yarn')
    sudo('yarn global add pino pm2 bower ember-cli webpack@^2.2.0-rc eslint')

    # pm2
    sudo('env PATH=$PATH:/usr/bin /usr/local/share/.config/yarn/global/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy')

def setup_file_structure():

    # Add deploy to www-data group so both deploy and www-data can write to
    # logs.
    sudo('usermod -a -G www-data deploy')

    # update pm2
    sudo('chown -R deploy:dev /home/deploy/.pm2')

    for path in [
            env.app_path, env.releases_path, env.shared_path,
            env.repo_path]:
        sudo('mkdir -p %s' % path)
        sudo('chown -R %s:%s %s' % (env.user, env.group, path))
    
    # Make log/pid path
    for www_data_path in [env.log_path, env.pid_path]:
        sudo('mkdir -p %s' % www_data_path)
        sudo('chown www-data:www-data -R %s' % www_data_path)

    # Let group write to log path (allowing deploy and www-data to write)
    sudo('chmod a+rw %s' % env.log_path)

    # Install logrotate
    upload_template(
        'config/logrotate.conf',
        '/etc/logrotate.d/%s' % env.project_name, env,
        use_jinja=True, use_sudo=True, template_dir=FAB_ROOT,
        backup=False)


def setup_virtualenv():
    "Setup virtualenv."
    run('virtualenv --no-site-packages --distribute %(env_path)s' % env)


def _create_release():
    "Create a release path."
    now = int(time.time())
    env.release = '%s' % now
    env.release_path = '%s/%s' % (env.releases_path, env.release)


def download_repo():
    "Clone repository"
    # Add github to known hosts to bypass 'are you sure you want to connect'
    # message
    run('ssh-keyscan github.com >> ~/.ssh/known_hosts')    
    run('if [ ! -d %s/.git ]; then git clone %s %s; fi' % (
        env.repo_path, GIT_REMOTE, env.repo_path))
    checkout_repo()
    create_release()
    update_to_latest_release()


def checkout_repo():
    "Check out latest revision."

    # Update branch.
    with cd(env.repo_path):
        run(
            "git checkout %(repo_branch)s && "
            "git fetch origin && "
            "git reset --hard origin/%(repo_branch)s" % env)

def create_release():
    # And copy to new release, removing git folder.
    _create_release()

    symlink_paths = [
        '/fptcore/node_modules',
        '/apps/travel/node_modules',
        '/apps/travel/bower_components',
        '/apps/agency/node_modules',
        '/headquarters/node_modules',
        '/secrets'
    ]

    # Don't copy node modules -- symlink instead
    run((
        'rsync -a %(repo_path)s/ %(release_path)s/ ' +
        '--exclude /.git* ' +
        ' '.join(['--exclude %s*' % path for path in symlink_paths]))
        % env)
    for path in symlink_paths:
        source_path = '%s%s' % (env.repo_path, path)
        target_path = '%s%s' % (env.release_path, path.rsplit('/', 1)[0])
        run ('ln -s %s %s' % (source_path, target_path))

def update_to_latest_release():
    "Set 'current' symlink."
    with cd(env.app_path):
        with settings(warn_only=True):
            run('rm current')
        run('ln -s %(release_path)s current' % env)

@roles('app')
def db_migrate():
    with cd(env.hq_path):
        run('export $(cat ../env | xargs) && ./node_modules/.bin/sequelize db:migrate')

@roles('app')
def script_migrate():
    with cd(env.hq_path):
        run('export $(cat ../env | xargs) && yarn run scripts:migrate')

def install_node_requirements():
    # with cd(env.repo_path):
    #     run('npm install')
    with cd('%s/headquarters' % env.repo_path):
        run('yarn install')
    with cd('%s/fptcore' % env.repo_path):
        run('yarn install')
    with cd('%s/apps/agency' % env.repo_path):
        run('yarn install')
        run('rm -rf %s/apps/agency/node_modules/fptcore' % env.repo_path)
        run('ln -nsf %s/fptcore %s/apps/agency/node_modules'
             % (env.repo_path, env.repo_path))
    with cd('%s/apps/travel' % env.repo_path):
        run('yarn install')
        run('rm -rf %s/apps/travel/node_modules/fptcore' % env.repo_path)
        run('ln -nsf %s/fptcore %s/apps/travel/node_modules'
             % (env.repo_path, env.repo_path))
        run('bower install')
    # with cd('%s/headquarters' % env.repo_path):
    #     run('ln -nsf %s/apps/fptcore %s/headquarters/node_modules'
    #          % (env.repo_path, env.repo_path))

def install_nginx():
    sudo('add-apt-repository -y ppa:nginx/stable')
    sudo('apt-get update')
    sudo('apt-get -y install nginx')
    sudo('rm -f /etc/nginx/sites-enabled/default')


#######################################################
########## Deploy #####################################
#######################################################

def update_environment():
    # Upload env file
    put(os.path.join(PROJECT_ROOT, 'secrets/env-%(stage)s' % env),
        '%(shared_path)s/env' % env)
    # Upload secrets to cached-copy of git repo so they can
    # easily fold into dir structure like local
    put(os.path.join(PROJECT_ROOT, 'secrets'), env.repo_path)


@roles('app')
def update_virtualhosts():
    "Update virtualhosts."
    # Nginx
    upload_template(
        'config/nginx.conf',
        '/etc/nginx/sites-available/%(project_name)s' % env, env,
        use_jinja=True, use_sudo=True, template_dir=FAB_ROOT,
        backup=False)
    with quiet():
        sudo(
            "ln -s /etc/nginx/sites-available/%(project_name)s "
            "/etc/nginx/sites-enabled/%(project_name)s" % env)

    sudo("service nginx reload || echo 'Error reloading.'")


def _config():
    "Update all configurations and virtual hosts."
    update_environment()
    install_node_requirements()


@roles('app')
def config():
    "Update all configurations and virtual hosts."
    merge_master()
    checkout_repo()
    _config()
    update_virtualhosts()
    clear_old()

@roles('app')
def config_and_deploy():
    "Deploy, configure, and full restart"
    merge_master()
    checkout_repo()
    _config()
    _deploy()
    update_virtualhosts()
    if env.host_string in env.roledefs.get('app', []):
        app_stop()
        app_start()
    clear_old()


@roles('app')
def deploy():
    "Deploy and graceful restart"
    merge_master()
    checkout_repo()
    _deploy()
    if env.host_string in env.roledefs.get('app', []):
        app_graceful_restart()
    clear_old()

def _deploy():
    "Just deploy new code."
    create_release()
    copy_environment()
    build_apps()
    update_to_latest_release()
    db_migrate()
    script_migrate()


def _get_releases():
    return sorted(filter(
        bool, re.split(r'\s+', run('ls %s' % env.releases_path))))


@roles('app')
def clear_old():
    # Sort folders from old to new
    all_dirs = _get_releases()
    remove_dirs = all_dirs[:-KEEP_RELEASES]
    # Run remove tasks in the background
    for d in remove_dirs:
        run('rm -rf %s/%s' % (env.releases_path, d))

def copy_environment():
    run('cp %(shared_path)s/env %(release_path)s' % env)


@roles('app')
def build_apps():
    with cd(env.release_path):
        run('export $(cat ./env | xargs) && yarn run build')


#######################################################
########## Web availability ###########################
#######################################################

env.pm2_path = '/usr/local/bin/pm2';
env.pm2_config = './current/deploy/config/pm2.json'

@roles('app')
def app_status():
    with cd(env.app_path):
        run('%(pm2_path)s status %(pm2_config)s' % env)

@roles('app')
def app_stop():
    sudo("service nginx stop || echo 'Error stopping.'")
    with cd(env.app_path):
        run('%(pm2_path)s delete %(pm2_config)s' % env)


@roles('app')
def app_start():
    with settings(warn_only=True):
        sudo("service nginx start")
        with cd(env.app_path):
            run('%(pm2_path)s startOrRestart %(pm2_config)s' % env)

@roles('app')
def app_force_restart():
    sudo("service nginx restart || sudo service nginx start")
    with cd(env.app_path):
        run('%(pm2_path)s startOrRestart %(pm2_config)s' % env)

@roles('app')
def app_graceful_restart():
    sudo("kill -HUP `cat /var/run/nginx.pid` || sudo service nginx start")
    with cd(env.app_path):
        run('%(pm2_path)s startOrReload %(pm2_config)s' % env)


#######################################################
########## DB tasks ###################################
#######################################################

@roles('app')
def db_load_from_remote():
    local_path = '~/Downloads/%s_backup.sql' % env.stage
    with cd(env.hq_path):
        run('export $(cat ../env | xargs) && mysqldump -h $DATABASE_HOST -p$DATABASE_PASSWORD -u $DATABASE_USER $DATABASE_NAME > /home/deploy/backup.sql')
    get(remote_path='/home/deploy/backup.sql',
        local_path=local_path)
    local('mysql -u galaxy -pgalaxypassword -h 127.0.0.1 -P 4306 galaxy < %s' % local_path)
