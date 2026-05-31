import api from './axios';

export interface ActivityLog {
  activity_type: string;
  location?: number;
  product?: number;
  producer?: number;
  metadata?: Record<string, any>;
}

export interface ProducerStatistics {
  id: number;
  business_name: string;
  total_views: number;
  total_favorites: number;
  total_phone_clicks: number;
  total_whatsapp_clicks: number;
  total_directions_clicks: number;
  monthly_views: number;
  monthly_favorites: number;
  views_growth: number;
  favorites_growth: number;
  total_locations: number;
  total_products: number;
  last_calculated: string;
}

export interface LocationStatistics {
  location_id: number;
  location_name: string;
  total_views: number;
  total_favorites: number;
  monthly_views: number;
  monthly_favorites: number;
}

export interface TopLocation {
  location__id: number;
  location__name: string;
  views: number;
}

export interface AnalyticsSummary {
  producer_stats: ProducerStatistics;
  location_stats: LocationStatistics[];
  recent_activities: any[];
  top_locations: TopLocation[];
  engagement_rate: number;
}

export interface DailyStats {
  date: string;
  count: number;
}

export interface TimelineData {
  daily_views: DailyStats[];
  daily_favorites: DailyStats[];
}

/**
 * Log an activity (view, click, etc.)
 */
export const logActivity = async (data: ActivityLog) => {
  const response = await api.post('/analytics/logs/', data);
  return response.data;
};

/**
 * Log a location view
 */
export const logLocationView = async (locationId: number, producerId?: number) => {
  return logActivity({
    activity_type: 'LOCATION_VIEW',
    location: locationId,
    producer: producerId,
  });
};

/**
 * Log a phone click
 */
export const logPhoneClick = async (locationId: number, producerId?: number) => {
  return logActivity({
    activity_type: 'PHONE_CLICK',
    location: locationId,
    producer: producerId,
  });
};

/**
 * Log a WhatsApp click
 */
export const logWhatsAppClick = async (locationId: number, producerId?: number) => {
  return logActivity({
    activity_type: 'WHATSAPP_CLICK',
    location: locationId,
    producer: producerId,
  });
};

/**
 * Log a directions click
 */
export const logDirectionsClick = async (locationId: number, producerId?: number) => {
  return logActivity({
    activity_type: 'DIRECTIONS_CLICK',
    location: locationId,
    producer: producerId,
  });
};

/**
 * Get statistics for the current producer
 */
export const getMyStatistics = async (): Promise<ProducerStatistics> => {
  const response = await api.get('/analytics/statistics/me/');
  return response.data;
};

/**
 * Get comprehensive analytics summary
 */
export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
  const response = await api.get('/analytics/statistics/summary/');
  return response.data;
};

/**
 * Get timeline data (daily stats for last 30 days)
 */
export const getTimeline = async (): Promise<TimelineData> => {
  const response = await api.get('/analytics/statistics/timeline/');
  return response.data;
};

/**
 * Recalculate statistics for the current producer
 */
export const recalculateStatistics = async (): Promise<ProducerStatistics> => {
  const response = await api.post('/analytics/statistics/recalculate/');
  return response.data;
};
