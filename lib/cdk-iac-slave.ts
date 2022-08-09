import {  Duration,Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// new modules
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';



interface CdkIacStackProps extends StackProps {
  lambdaRoleName:any,
  appName_: any,

}
export class CdkIacStackSlave extends Stack {
  constructor(scope: Construct, id: string, props?: CdkIacStackProps) {
    super(scope, id, props);

        const vpc = ec2.Vpc.fromLookup(this, 'PRD-vpc', {
      vpcName: 'PRD',
    });



const sg_jk = ec2.SecurityGroup.fromLookupByName(
  this,
  'PRD-sg_jk',
  'sg_jenkins',
 vpc
);

    sg_jk.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'allow SSH access from anywhere',
    );

    sg_jk.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow HTTP traffic from anywhere',
    );

    sg_jk.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'allow HTTPS traffic from anywhere',
    );


    const slave_jk_role = new iam.Role(this, 'jk-role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });
  

    const ec2Instance = new ec2.Instance(this, 'ec2-instance', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      role: slave_jk_role,
      securityGroup: sg_jk,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: 'slave-key-pair',
    });
  }
}


  






/*


    const vpc = new ec2.Vpc(this, 'my-cdk-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      subnetConfiguration: [
        {name: 'public', cidrMask: 24, subnetType: ec2.SubnetType.PUBLIC},
      ],
    });

*/