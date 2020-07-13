locals {
  content_bucket_name = var.environment_name == "production" ? "fpt-agency-content" : "fpt-agency-content-${var.environment_name}"
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
  # Push to S3 for file uploads
  statement {
    actions = ["s3:*"]
    resources = ["arn:aws:s3:::${local.content_bucket_name}/*"]
  }
}

resource "aws_iam_role" "charter_task" {
  name               = "charter-${var.environment_name}-task"
  assume_role_policy = data.aws_iam_policy_document.charter_task_trust.json
}

resource "aws_iam_role_policy" "charter_task_policy" {
  name   = "charter-${var.environment_name}-task-policy"
  role   = aws_iam_role.charter_task.id
  policy = data.aws_iam_policy_document.charter_task_policy.json
}