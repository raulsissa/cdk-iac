import {  Duration,Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// new modules
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cfn from 'aws-cdk-lib/aws-cloudformation';


//DECLARATION 
declare const hostedZoneId: string;
declare const zoneName = 'prd.internal';
const myDomainName = 'jk.prd.internal';
interface CdkIacStackProps extends StackProps {
  lambdaRoleName:any,
  appName_: any,

}
export class CdkIacStack extends Stack {
  constructor(scope: Construct, id: string, props?: CdkIacStackProps) {
    super(scope, id, props);


    // VPC
    //const vpc_old = new ec2.Vpc(this, 'jenkins-vpc', {
    //  cidr: "10.0.0.0/16"
    //})

    const vpc = ec2.Vpc.fromLookup(this, 'PRD-vpc', {
      vpcName: 'PRD',
    });

    // CLUSTER ECS
    const cluster = new ecs.Cluster(this, 'devops-cluster', {
      vpc,
      clusterName: 'devops-cluster'
    });

    // FILE-SYSTEM
    const fileSystem = new efs.FileSystem(this, 'JenkinsFileSystem', {
      vpc: vpc,
     // removalPolicy: RemovalPolicy.DESTROY
    });

    const accessPoint = fileSystem.addAccessPoint('AccessPoint', {
      path: '/jenkins-home',
      posixUser: {
        uid: '1000',
        gid: '1000',
      },
      createAcl: {
        ownerGid: '1000',
        ownerUid: '1000',
        permissions: '755'
      }
    });

    //TASK DEF

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'jenkins-task-definition', {
      memoryLimitMiB: 1024,
      cpu: 512,
      family: 'jenkins'
    });

    taskDefinition.addVolume({
      name: 'jenkins-home',
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
        transitEncryption: 'ENABLED',
        authorizationConfig: {
          accessPointId: accessPoint.accessPointId,
          iam: 'ENABLED'
        }
      }
    });
    const containerDefinition = taskDefinition.addContainer('jenkins', {
      image: ecs.ContainerImage.fromRegistry("jenkins/jenkins:2.346.2-jdk11"),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'jenkins' }),
      portMappings: [{
        containerPort: 8080
      }]
    });
    containerDefinition.addMountPoints({
      containerPath: '/var/jenkins_home',
      sourceVolume: 'jenkins-home',
      readOnly: false
    });

    // CLUSTER SERVICE 

    const service = new ecs.FargateService(this, 'JenkinsService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      maxHealthyPercent: 100,
      minHealthyPercent: 0,
      healthCheckGracePeriod: Duration.minutes(5)
    });
    service.connections.allowTo(fileSystem, ec2.Port.tcp(2049));

    //let certificateArn = this.node.tryGetContext('certificateArn');
    //if (certificateArn) {
      const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', { vpc, internetFacing: true });
     // new CfnOutput(this, 'LoadBalancerDNSName', { value: loadBalancer.loadBalancerDnsName });

      const listener = loadBalancer.addListener('Listener', {
        port: 80,
       // certificateArns: [certificateArn]
      }
      );
      listener.addTargets('JenkinsTarget', {
        port: 8080,
        targets: [service],
        deregistrationDelay: Duration.seconds(10),
        healthCheck: {
          path: '/login'
        }
      });

      // hosted zone registration
    }


//    const hostedZoneName = this.node.tryGetContext('hostedZoneName')
//   // if (hostedZoneName) {
//      const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
//        domainName: hostedZoneName
//      }
//      );
//  new route53.CnameRecord(this, 'CnameRecord', {
//    zone: hostedZone,
//    recordName: 'jenkins',
//    domainName: loadBalancer.loadBalancerDnsName,
//    ttl: Duration.minutes(1)
////  }
//  );
//    }

   

//    const zone = route53.HostedZone.fromHostedZoneAttributes(this, `HostedZone`, {
//      hostedZoneId,
//      zoneName,
//    });
//
//    new route53.CnameRecord(this, `CnameApiRecord`, {
//      recordName: 'api',
//      zone,
//      domainName: myDomainName,
//    });


  }
