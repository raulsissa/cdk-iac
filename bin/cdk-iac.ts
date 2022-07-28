
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from "dotenv";
import { CdkIacStack } from '../lib/cdk-iac-stack';
require("dotenv").config();

// -------- REMEMBER TO CHANGE ACCOOUNT INFORMATION -----------

const ACCOUNT_IDENTIFIER = `${process.env.ACCOUNT_IDENTIFIER}`;
const ACCOUNT_REGION = `${process.env.ACCOUNT_REGION}`;
const ACCOUNT_NUMBER = `${process.env.ACCOUNT_NUMBER}`;
const ACCOUNT_ENVIRONMENT = `${process.env.ACCOUNT_ENVIRONMENT}`;
const PROJECT = 'devops';

const APPLICATION = 'jenkins'

// -------- STACK VARAIBLES -----------
const APPNAME = `br${ACCOUNT_IDENTIFIER}${ACCOUNT_REGION}-${PROJECT}-${APPLICATION}-${ACCOUNT_ENVIRONMENT}`;

const AWS_IAM = 'iam';
const AWS_CB = 'cbuild';


const app = new cdk.App();
new CdkIacStack(app,
  `${APPNAME}`, {
  
  
  lambdaRoleName: `${APPNAME}-${AWS_IAM}-role`,
  appName_: `${APPNAME}`,
  env: {
    account: process.env.ACCOUNT_NUMBER,
    region: 'us-east-1',}


    });
