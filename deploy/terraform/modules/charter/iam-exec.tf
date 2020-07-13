data "aws_iam_policy_document" "charter_exec_trust" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "charter_exec_policy" {
  # Get SSM parameters
  statement {
    actions = ["ssm:GetParameters"]
    resources = [
      "arn:aws:ssm:us-west-2:875382849197:parameter/charter.global.*",
      "arn:aws:ssm:us-west-2:875382849197:parameter/charter.${var.environment_name}.*"
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
}

resource "aws_iam_role" "charter_exec" {
  name               = "charter-${var.environment_name}-exec"
  assume_role_policy = data.aws_iam_policy_document.charter_exec_trust.json
}

resource "aws_iam_role_policy" "charter_exec_policy" {
  name   = "charter-${var.environment_name}-exec-policy"
  role   = aws_iam_role.charter_exec.id
  policy = data.aws_iam_policy_document.charter_exec_policy.json
}