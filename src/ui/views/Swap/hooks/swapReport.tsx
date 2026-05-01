import stats from '@/stats';
import { useRbiSource } from '@/ui/utils/ga-event';
import { useEffect } from 'react';

export const useSwapStatsReport = () => {
  const rbiSource = useRbiSource();

  useEffect(() => {
    // DISABLED: No tracking for custom pools
    // if (rbiSource) {
    //   stats.report('enterSwapDescPage', {
    //     refer: rbiSource,
    //   });
    // }
  }, [rbiSource]);
};
