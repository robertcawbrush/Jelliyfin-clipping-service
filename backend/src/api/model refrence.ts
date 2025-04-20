// lets define models here like video and clip

// video
// id
//  streamUrl: string,
//     startTimeStamp: string (01:59:59)
//     endTimeStamp: string (01:59:59)
export type video = {
    id: number,
    streamUrl: string,
    startTimeStamp: string, // (01:59:59)
    endTimeStamp: string, // (01:59:59)
}

export type clip = {
id: number,
dateCreated: DateTime,
dateUpdated: DateTime,
length: string,
fileType: string
}