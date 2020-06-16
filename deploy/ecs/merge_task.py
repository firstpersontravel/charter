#!/usr/bin/env python

import sys
import os
import yaml
import json

def main(env_name):
    task_path = os.path.join(os.path.dirname(__file__), 'task.yaml')
    task_data = yaml.safe_load(open(task_path))
    env_path = os.path.join(os.path.dirname(__file__), '{}.yaml'.format(env_name))
    env_data = yaml.safe_load(open(env_path))
    for container_data in task_data['containerDefinitions']:
        container_data['environment'] = env_data['environment']
        container_data['secrets'] = env_data['secrets']
    print(json.dumps(task_data, indent=2))

if __name__ == '__main__':
    main(sys.argv[1])
