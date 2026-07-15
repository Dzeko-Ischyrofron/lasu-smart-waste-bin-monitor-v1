
CREATE OR REPLACE FUNCTION public.get_telemetry_trend(_bin_id text, _range text)
RETURNS TABLE(bucket timestamptz, fill_avg numeric, gas_avg numeric, gas_alerts bigint, sample_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  window_size interval;
  bucket_size interval;
  bucket_secs numeric;
BEGIN
  IF _range = 'week' THEN
    window_size := interval '7 days';
    bucket_size := interval '6 hours';
  ELSIF _range = 'month' THEN
    window_size := interval '30 days';
    bucket_size := interval '1 day';
  ELSE
    window_size := interval '24 hours';
    bucket_size := interval '1 hour';
  END IF;

  bucket_secs := extract(epoch from bucket_size);

  RETURN QUERY
  SELECT
    to_timestamp(floor(extract(epoch from t.created_at) / bucket_secs) * bucket_secs) AS bucket,
    avg(t.waste_pct)::numeric AS fill_avg,
    avg(t.gas_ppm_est)::numeric AS gas_avg,
    count(*) FILTER (WHERE COALESCE(t.gas_alert, false) OR COALESCE(t.gas_ppm_est, 0) > 300)::bigint AS gas_alerts,
    count(*)::bigint AS sample_count
  FROM public.waste_bin_telemetry t
  WHERE t.bin_id = _bin_id
    AND t.created_at >= now() - window_size
  GROUP BY 1
  ORDER BY 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_telemetry_trend(text, text) TO authenticated, anon, service_role;
