data "aws_ecs_task_definition" "charter" {
  task_definition = aws_ecs_task_definition.charter_bootstrap.family
}

data "aws_ecs_cluster" "charter" {
  cluster_name = "charter"
}

resource "aws_security_group" "charter_task" {
  name        = "charter-${var.environment_name}-task"
  description = "Allow task inbound traffic"
  vpc_id      = data.aws_vpc.charter.id

  ingress {
    from_port = 5001
    to_port   = 5001
    protocol  = "tcp"
    security_groups = [aws_security_group.charter_ingress.id]
  }

  ingress {
    from_port = 5002
    to_port   = 5002
    protocol  = "tcp"
    security_groups = [aws_security_group.charter_ingress.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_task_definition" "charter_bootstrap" {
  family                   = "charter-${var.environment_name}"
  execution_role_arn       = "arn:aws:iam::875382849197:role/charter-service"
  network_mode             = "awsvpc"
  cpu                      = 2048
  memory                   = 4096
  container_definitions    = var.container_definitions
  requires_compatibilities = ["FARGATE"]
}

resource "aws_ecs_service" "charter" {
  name          = "charter-${var.environment_name}"
  cluster       = data.aws_ecs_cluster.charter.id
  desired_count = 1

  network_configuration {
    subnets = data.aws_subnet_ids.charter.ids
    security_groups = [aws_security_group.charter_task.id]
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight = 1
    base = 0
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.charter_server_web.arn
    container_name   = "server"
    container_port   = 5001
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.charter_server_pubsub.arn
    container_name   = "pubsub"
    container_port   = 5002
  }

  # Track the latest ACTIVE revision
  task_definition = "${aws_ecs_task_definition.charter_bootstrap.family}:${max("${aws_ecs_task_definition.charter_bootstrap.revision}", "${data.aws_ecs_task_definition.charter.revision}")}"

}
