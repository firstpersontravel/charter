data "aws_ecs_task_definition" "charter" {
  task_definition = aws_ecs_task_definition.charter_bootstrap.family
}

data "aws_ecs_cluster" "charter" {
  cluster_name = "charter"
}

resource "aws_cloudwatch_log_group" "charter" {
  name = "charter-${var.environment_name}"
}

resource "aws_security_group" "charter_task" {
  name        = "charter-${var.environment_name}-task"
  description = "Allow task inbound traffic"
  vpc_id      = data.aws_vpc.charter.id

  ingress {
    from_port       = 5001
    to_port         = 5001
    protocol        = "tcp"
    security_groups = [aws_security_group.charter_ingress.id]
  }

  ingress {
    from_port       = 5002
    to_port         = 5002
    protocol        = "tcp"
    security_groups = [aws_security_group.charter_ingress.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_iam_policy_document" "charter_task_trust" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "charter_task_policy" {
  # Get SSM parameters
  statement {
    actions = ["ssm:GetParameters"]
    resources = [
      "arn:aws:ssm:us-west-2:875382849197:parameter/charter.global.*",
      "arn:aws:ssm:us-west-2:875382849197:parameter/charter.staging.*"
    ]
  }

  # Pull container from ECR
  statement {
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetAuthorizationToken",
      "ecr:GetDownloadUrlForLayer"
    ]

    # "arn:aws:ecr:us-west-2:875382849197:repository/charter"
    resources = ["*"]
  }

  # Push logs to cloudwatch
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]

    resources = ["arn:aws:logs:*:*:*"]
  }

  # Push to S3 for signing
  statement {
    actions = ["s3:PutObject"]
    resources = [
      "arn:aws:s3:::fpt-agency-content*/*"
    ]
  }
}

resource "aws_iam_role" "charter_task" {
  name   = "charter-${var.environment_name}-task"
  assume_role_policy = data.aws_iam_policy_document.charter_task_trust.json
}

resource "aws_iam_role_policy" "charter_task_policy" {
  name   = "charter-${var.environment_name}-task-policy"
  role   = aws_iam_role.charter_task.id
  policy = data.aws_iam_policy_document.charter_task_policy.json
}

resource "aws_ecs_task_definition" "charter_bootstrap" {
  family                   = "charter-${var.environment_name}"
  execution_role_arn       = aws_iam_role.charter_task.arn
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
    subnets          = data.aws_subnet_ids.charter.ids
    security_groups  = [aws_security_group.charter_task.id]
    assign_public_ip = true
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 0
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
