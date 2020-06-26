terraform {
  backend "s3" {
    bucket         = "fpt-tech"
    key            = "tfstate/test"
    region         = "us-west-2"
    dynamodb_table = "fpt-terraform-lock"
  }
}

provider "aws" {
  version = "~> 2.0"
  region  = "us-west-2"
}

module "charter" {
  source                = "../../modules/charter"
  environment_name      = "test"
  container_definitions = file("containers.json")
}
