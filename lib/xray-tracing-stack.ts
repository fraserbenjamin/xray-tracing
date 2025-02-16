import * as cdk from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class XrayTracingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const xrayTracingLambda = new NodejsFunction(this, "xray-tracing-function", {
      functionName: "xray-tracing",
      runtime: Runtime.NODEJS_22_X, // Provide any supported Node.js runtime
      entry: "./functions/demo/index.ts",
      architecture: Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      bundling: {
        nodeModules: ["aws-xray-sdk-core"],
        minify: false,
        platform: 'node',
        forceDockerBundling: false,
        mainFields: ['module', 'main'],
        format: OutputFormat.ESM,
      },
      tracing: Tracing.ACTIVE,
      environment: {
        AWS_XRAY_CONTEXT_MISSING: "LOG_ERROR",
      }
    });

    // Add the AWS X-Ray tracing policy to the Lambda function
    xrayTracingLambda.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords",
        "xray:GetSamplingRules",
        "xray:GetSamplingTargets",
        "xray:GetSamplingStatisticSummaries",
        "s3:ListAllMyBuckets",
      ],
      resources: ["*"],
    }));
  }
}
