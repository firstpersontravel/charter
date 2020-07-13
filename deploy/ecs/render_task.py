#!/usr/bin/env python

import sys
import os
import yaml
import json

exec_role_format = 'arn:aws:iam::875382849197:role/charter-{}-exec'
task_role_format = 'arn:aws:iam::875382849197:role/charter-{}-task'
registry = '875382849197.dkr.ecr.us-west-2.amazonaws.com'
ssm = 'arn:aws:ssm:us-west-2:875382849197:parameter'

def construct_env(env):
    return [{ 'name': k, 'value': env[k] } for k in sorted(env.iterkeys())]

def construct_secrets(secrets):
    return [
        { 'name': k, 'valueFrom': '{}/{}'.format(ssm, secrets[k]) }
        for k in sorted(secrets.iterkeys())]

def main(env_name, git_hash, integer_resources):
    # Load core info
    task_path = os.path.join(os.path.dirname(__file__), 'task.yaml')
    task_data = yaml.safe_load(open(task_path))

    # Load env info
    env_path = os.path.join(os.path.dirname(__file__), '{}.yaml'.format(env_name))
    env_data = yaml.safe_load(open(env_path))

    # Add resources and role to core info
    task_data.update(env_data['resources'])

    # Set roles
    task_data['executionRoleArn'] = exec_role_format.format(env_name)
    task_data['taskRoleArn'] = task_role_format.format(task_role)

    if integer_resources:
        task_data['cpu'] = int(task_data['cpu'])
        task_data['memory'] = int(task_data['memory'])

    # Add env to core info
    for container_data in task_data['containerDefinitions']:
        container_data['environment'] = construct_env(env_data['environment'])
        container_data['secrets'] = construct_secrets(env_data['secrets'])

    # Fill in env, image, git hash
    image_url = '{}/charter:{}'.format(registry, git_hash)
    text = (json
        .dumps(task_data, indent=2)
        .replace('__ENVIRONMENT__', env_name)
        .replace('__IMAGE__', image_url)
        .replace('__GIT_HASH__', git_hash))

    # Output results to stdout
    print(text)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], len(sys.argv) > 3 and sys.argv[3] == 'true')
