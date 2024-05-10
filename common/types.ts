export interface BucketCmdContent {
  mainCmd: string;
  subCmd: string;
  bucketName: string;
  newBucketName?: string;
}

export interface SplitCmdContent {
  mainCmd: string;
  subCmd: string;
  splitName: string;
  newSplitName?: string;
  goal?: number;
  bucketName?: string;
}

export interface RecordCmdContent {
  mainCmd: string;
  subCmd: string;
  amount: number;
  splitName: string;
  newSplitName?: string;
  note: string;
  recordType: string;
}
