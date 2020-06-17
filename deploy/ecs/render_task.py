#!/usr/bin/env python

import sys
import os
import yaml
import json

registry = '875382849197.dkr.ecr.us-west-2.amazonaws.com'

def main(env_name, git_hash):
    task_path = os.path.join(os.path.dirname(__file__), 'task.yaml')
    task_data = yaml.safe_load(open(task_path))
    task_data['cpu'] = str(task_data['cpu'])
    task_data['memory'] = str(task_data['memory'])
    env_path = os.path.join(os.path.dirname(__file__), '{}.yaml'.format(env_name))
    env_data = yaml.safe_load(open(env_path))
    for container_data in task_data['containerDefinitions']:
        container_data['cpu'] = str(container_data['cpu'])
        container_data['memory'] = str(container_data['memory'])
        container_data['environment'] = env_data['environment']
        container_data['secrets'] = env_data['secrets']
    image_url = '{}/charter:{}'.format(registry, git_hash)
    text = (json
        .dumps(task_data, indent=2)
        .replace('__ENVIRONMENT__', env_name)
        .replace('__IMAGE__', image_url)
        .replace('__GIT_HASH__', git_hash))
    print(text)

if __name__ == '__main__':
    main(sys.argv[1],sys.argv[2])