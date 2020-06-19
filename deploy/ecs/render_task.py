#!/usr/bin/env python

import sys
import os
import yaml
import json

registry = '875382849197.dkr.ecr.us-west-2.amazonaws.com'
ssm = 'arn:aws:ssm:us-west-2:875382849197:parameter'

def construct_env(env):
    return [{ 'name': k, 'value': env[k] } for k in sorted(env.iterkeys())]

def construct_secrets(secrets):
    return [
        { 'name': k, 'valueFrom': '{}/{}'.format(ssm, secrets[k]) }
        for k in sorted(secrets.iterkeys())]

def main(env_name, git_hash, integer_resources):
    task_path = os.path.join(os.path.dirname(__file__), 'task.yaml')
    task_data = yaml.safe_load(open(task_path))
    if integer_resources:
        task_data['cpu'] = int(task_data['cpu'])
        task_data['memory'] = int(task_data['memory'])
    env_path = os.path.join(os.path.dirname(__file__), '{}.yaml'.format(env_name))
    env_data = yaml.safe_load(open(env_path))
    for container_data in task_data['containerDefinitions']:
        if integer_resources:
            container_data['cpu'] = int(container_data['cpu'])
            container_data['memory'] = int(container_data['memory'])
        container_data['environment'] = construct_env(env_data['environment'])
        container_data['secrets'] = construct_secrets(env_data['secrets'])
    image_url = '{}/charter:{}'.format(registry, git_hash)
    text = (json
        .dumps(task_data, indent=2)
        .replace('__ENVIRONMENT__', env_name)
        .replace('__IMAGE__', image_url)
        .replace('__GIT_HASH__', git_hash))
    print(text)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], len(sys.argv) > 3 and sys.argv[3] == 'true')
