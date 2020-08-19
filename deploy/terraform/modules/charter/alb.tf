resource "aws_security_group" "charter_ingress" {
  name        = "charter-${var.environment_name}-ingress"
  description = "Allow inbound traffic"
  vpc_id      = data.aws_vpc.charter.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb_target_group" "charter_server_web" {
  name        = "charter-${var.environment_name}-web"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.charter.id
  target_type = "ip"

  deregistration_delay = "30"

  health_check {
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 5
    timeout             = 3
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb" "charter" {
  name               = "charter-${var.environment_name}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.charter_ingress.id]
  subnets            = data.aws_subnet_ids.charter.ids
}

resource "aws_lb_listener" "charter_web_https" {
  load_balancer_arn = aws_lb.charter.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = "arn:aws:acm:us-west-2:875382849197:certificate/b58bb07e-a772-42e1-9f3f-a56a9d7dc4e9"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.charter_server_web.arn
  }
}

resource "aws_lb_listener" "charter_web_http" {
  load_balancer_arn = aws_lb.charter.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.charter_server_web.arn
  }
}