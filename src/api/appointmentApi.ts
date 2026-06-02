import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

export interface DoctorService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description?: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
}

export interface DoctorAvailability {
  id?: string;
  doctor_id: string;
  clinic_id: string;
  is_recurring: boolean;
  day_of_week: number; // 0 = Monday, 6 = Sunday
  start_time: string;  // "HH:MM:SS"
  end_time: string;    // "HH:MM:SS"
}

export const appointmentApi = {
  // =========================================================
  // PATIENT FLOW TASKS
  // =========================================================

  // Fetch all services offered by a doctor
  getDoctorServices: async (doctorId: string): Promise<DoctorService[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/appointments/services/${doctorId}`);
      return response.data.services;
    } catch (error) {
      console.error("Error fetching doctor services:", error);
      return [];
    }
  },

  // Get available time string (HH:mm) for a specific date and service
  getAvailableSlots: async (doctorId: string, serviceId: string, date: string): Promise<string[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/appointments/slots/${doctorId}`, {
        params: { service_id: serviceId, date }
      });
      return response.data.slots;
    } catch (error) {
      console.error("Error fetching slots:", error);
      return [];
    }
  },

  // Finalize the booking in the database
  bookAppointment: async (data: {
    doctor_id: string;
    patient_id: string;
    clinic_id: string;
    service_id: string;
    start_ts: string; // ISO string
    notes?: string;
  }) => {
    try {
      const response = await axios.post(`${BASE_URL}/appointments/book`, data);
      return response.data;
    } catch (error) {
      console.error("Booking transaction failed:", error);
      throw error;
    }
  },

  // =========================================================
  // DOCTOR CONFIGURATION / MANAGEMENT TASKS
  // =========================================================

  // --- Service Management ---
  addDoctorService: async (payload: {
    doctor_id: string;
    name: string;
    duration_minutes: number;
    price: number;
    description?: string;
  }): Promise<any> => {
    try {
      const response = await axios.post(`${BASE_URL}/appointments/services`, payload);
      return response.data;
    } catch (error) {
      console.error("Error creating doctor service:", error);
      throw error;
    }
  },

  deleteDoctorService: async (serviceId: string): Promise<any> => {
    try {
      const response = await axios.delete(`${BASE_URL}/appointments/services/${serviceId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting doctor service:", error);
      throw error;
    }
  },

  // --- Clinic Registry Management ---
  getDoctorClinics: async (doctorId: string): Promise<Clinic[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/appointments/clinics/${doctorId}`);
      return response.data.clinics;
    } catch (error) {
      console.error("Error fetching doctor clinics:", error);
      return [];
    }
  },

  // --- Availability Schedule Matrix Management ---
  getDoctorAvailabilities: async (doctorId: string): Promise<DoctorAvailability[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/appointments/availabilities/${doctorId}`);
      return response.data.availabilities;
    } catch (error) {
      console.error("Error fetching doctor availabilities:", error);
      return [];
    }
  },

  addDoctorAvailability: async (payload: DoctorAvailability): Promise<any> => {
    try {
      const response = await axios.post(`${BASE_URL}/appointments/availabilities`, payload);
      return response.data;
    } catch (error) {
      console.error("Error creating timeline availability block:", error);
      throw error;
    }
  },

  deleteDoctorAvailability: async (availabilityId: string): Promise<any> => {
    try {
      const response = await axios.delete(`${BASE_URL}/appointments/availabilities/${availabilityId}`);
      return response.data;
    } catch (error) {
      console.error("Error removing targeted availability blocks:", error);
      throw error;
    }
  }
};