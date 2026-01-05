import * as Yup from 'yup';

export const checkupValidation = Yup.object().shape({
    complaint: Yup.string()
        .required('Patient complaint is required')
        .min(10, 'Complaint must be at least 10 characters')
        .max(500, 'Complaint must not exceed 500 characters'),

    allergy: Yup.string()
        .max(200, 'Allergy information must not exceed 200 characters'),

    history: Yup.string()
        .max(500, 'Medical history must not exceed 500 characters'),

    // Physical Examination
    consciousness: Yup.string()
        .required('Level of consciousness is required')
        .max(50, 'Must not exceed 50 characters'),

    bloodPressure: Yup.string()
        .matches(/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must be in format like 120/80')
        .required('Blood pressure is required'),

    pulse: Yup.number()
        .typeError('Pulse must be a number')
        .required('Pulse is required')
        .min(40, 'Pulse must be at least 40 bpm')
        .max(200, 'Pulse must not exceed 200 bpm'),

    respiration: Yup.number()
        .typeError('Respiration rate must be a number')
        .required('Respiration rate is required')
        .min(8, 'Respiration rate must be at least 8 breaths/min')
        .max(40, 'Respiration rate must not exceed 40 breaths/min'),

    temperature: Yup.number()
        .typeError('Temperature must be a number')
        .required('Temperature is required')
        .min(35.0, 'Temperature must be at least 35.0°C')
        .max(42.0, 'Temperature must not exceed 42.0°C'),

    oxygenSaturation: Yup.number()
        .typeError('Oxygen saturation must be a number')
        .required('Oxygen saturation is required')
        .min(70, 'Oxygen saturation must be at least 70%')
        .max(100, 'Oxygen saturation must not exceed 100%'),

    oxygenSource: Yup.string()
        .required('Oxygen source is required'),

    otherExamination: Yup.string()
        .max(300, 'Other examination findings must not exceed 300 characters'),

    // Investigations
    investigations: Yup.string()
        .max(500, 'Investigations must not exceed 500 characters'),

    // Diagnosis
    diagnosis: Yup.string()
        .required('Diagnosis is required')
        .min(10, 'Diagnosis must be at least 10 characters')
        .max(300, 'Diagnosis must not exceed 300 characters'),

    // Treatment
    treatment: Yup.string()
        .required('Treatment plan is required')
        .min(10, 'Treatment plan must be at least 10 characters')
        .max(500, 'Treatment plan must not exceed 500 characters'),

    // Recommendation
    recommendation: Yup.string()
        .max(300, 'Recommendation must not exceed 300 characters'),

    // Travel Recommendation
    fitToFly: Yup.boolean(),
    seatType: Yup.string()
        .oneOf(['ordinary', 'wheelchair', 'stretcher', 'business'], 'Invalid seat type'),
    travelEscort: Yup.string()
        .oneOf(['unescorted', 'nonMedical', 'medical'], 'Invalid travel escort type'),
    needsRepatriation: Yup.boolean(),
    medicallyNecessary: Yup.boolean(),

    // Doctor's Signature
    signature: Yup.string()
        .required('Signature is required')
        .min(2, 'Signature must be at least 2 characters')
        .max(50, 'Signature must not exceed 50 characters'),

    date: Yup.date()
        .required('Date is required')
        .max(new Date(), 'Date cannot be in the future'),

    time: Yup.string()
        .required('Time is required')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
});