import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

export interface DoctorService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description?: string;
}

export const bookingAgent = {
  // Fetch all services offered by a doctor
  getDoctorServices: async (doctorId: string): Promise<DoctorService[]> => {
    try {
      // We can hit Supabase directly or via our FastAPI if we want to wrap it
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
  }
};