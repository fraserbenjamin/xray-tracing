import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { type Handler } from "aws-cdk-lib/aws-lambda";
import AWSXRay from "aws-xray-sdk-core";
import { captureFetchGlobal } from 'aws-xray-sdk-fetch';

captureFetchGlobal();

const s3Client = AWSXRay.captureAWSv3Client(new S3Client());

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const handler: Handler = async (event: any) => {
  const segment = AWSXRay.getSegment();
  segment?.addAnnotation("test-annotation", "global");
  console.log(`Segment: ${segment?.name} is ${segment ? "defined" : "undefined"}`);

  const subSegment = segment?.addNewSubsegment("wait");
  subSegment?.addAttribute("test-attribute", "123");
  subSegment?.addAnnotation("test-annotation", "456");
  await wait(1000);
  subSegment?.close();

  const result = await AWSXRay.captureAsyncFunc("test-async", async (sub) => {

    const response = await fetch("https://example.com");
    console.log(await response.text());

    await wait(1000);

    sub?.addAnnotation("test-annotation", "abc");
    sub?.close();
    return "abc";
  });

  console.log(`Result: ${result}`);

  const response = await s3Client.send(new ListBucketsCommand({}));
  console.log(response);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello from Lambda!",
      input: event,
    }),
  }
}