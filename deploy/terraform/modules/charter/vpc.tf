data "aws_vpc" "charter" {
  id = "vpc-0f9f752701a23de70"
}

data "aws_subnet_ids" "charter" {
  vpc_id = data.aws_vpc.charter.id
}
