export function transformationData(data: any) {
  return {
    _id: data.publicId,
    title: data.title,
    subscriber: data.extendedProps.owner,
    vehicle: data.extendedProps.vehicle,
    appointment_date: data.extendedProps.appointment_date,
    appointment_time: data.extendedProps.appointment_time,
    description: data.extendedProps.description,
    notes: data.extendedProps.notes,
    isConfirmed: data.extendedProps.isConfirmed,
    notification_status: data.extendedProps.notification_status,
  };
}
