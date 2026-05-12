interface subscriber{
 _id:string
 fullName:string
}
interface vehicle{
_id:string;
plate:string
}
export interface Appointment{
_id:string;
subscriber:subscriber;
vehicle:vehicle;
appointment_date:Date;
appointment_time:string;
description:string;
notes:string;
notification_status:string;
isConfirmed:string;
}