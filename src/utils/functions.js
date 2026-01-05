export const getLocalStorageData = (key) => {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : {};
}

export const appointmentStatuses = (currentAppointments, filterBY) => {
    const allFilteredAppointment = currentAppointments.filter(appt => appt.status === filterBY);
    return allFilteredAppointment;
}

// export const setLocalStorageData = (key) => {
//     const setData = localStorage.setItem(key);
//     return setData ? JSON.stringify(setData) : {};
// }
