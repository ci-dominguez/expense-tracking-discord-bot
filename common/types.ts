export interface BucketCmdContent {
  mainCmd: string;
  subCmd: string;
  bucketName: string;
}

export interface SplitCmdContent {
  mainCmd: string;
  subCmd: string;
  splitName: string;
  goal?: string;
  bucketName?: string;
}

export interface RecordCmdContent {
  mainCmd: string;
  subCmd: string;
  amount: number;
  splitName: string;
  newSplitName?: string;
  note: string;
}
