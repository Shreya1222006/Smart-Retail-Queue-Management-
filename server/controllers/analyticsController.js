// ── QUEUE & FOOTFALL ANALYTICS ENGINE ──────────────────────

exports.getStoreAnalytics = async (req, res) => {
  try {
    // 1. Day-of-Week Traffic Distribution (%)
    const weeklyFootfall = [
      { day: 'Mon', trafficPercentage: 14, footfallCount: 420, isPeak: false },
      { day: 'Tue', trafficPercentage: 12, footfallCount: 360, isPeak: false },
      { day: 'Wed', trafficPercentage: 15, footfallCount: 450, isPeak: false },
      { day: 'Thu', trafficPercentage: 18, footfallCount: 540, isPeak: false },
      { day: 'Fri', trafficPercentage: 24, footfallCount: 720, isPeak: true },
      { day: 'Sat', trafficPercentage: 42, footfallCount: 1260, isPeak: true }, // Highest Peak
      { day: 'Sun', trafficPercentage: 38, footfallCount: 1140, isPeak: true }  // High Peak
    ]

    // 2. Hourly Rush Distribution
    const hourlyRush = [
      { timeSlot: '09 AM - 12 PM', label: 'Morning Calm', traffic: '20%', level: 'LOW' },
      { timeSlot: '12 PM - 04 PM', label: 'Afternoon Flow', traffic: '45%', level: 'MODERATE' },
      { timeSlot: '05 PM - 09 PM', label: 'Evening Peak Rush', traffic: '88%', level: 'HIGH' },
      { timeSlot: '09 PM - 11 PM', label: 'Night Wrap-up', traffic: '30%', level: 'LOW' }
    ]

    // 3. Dynamic Live Queue Estimation
    // Active customers currently in store
    const activeShoppers = Math.floor(Math.random() * 8) + 4 // e.g. 4-12 shoppers
    const avgItemsPerCart = 3.5
    const scanSpeedPerItemSeconds = 10
    const activeKiosks = 2

    // Wait time formula = (Active Shoppers * Avg Items * Speed) / (Kiosks * 60)
    const estimatedWaitMinutes = Math.max(
      1,
      Math.round((activeShoppers * avgItemsPerCart * scanSpeedPerItemSeconds) / (activeKiosks * 60))
    )

    const congestionLevel = estimatedWaitMinutes > 5 ? 'HIGH' : estimatedWaitMinutes >= 3 ? 'MODERATE' : 'LOW'

    // 4. Smart AI Action Recommendations
    const aiRecommendations = [
      '⚡ Peak Footfall on Saturday & Sunday: Enable all 4 self-checkout kiosks.',
      '🕒 Evening Rush (5PM - 9PM): Deploy 1 floor assistant for scanning help.',
      '📦 Milk & Parle-G are high velocity items: Restock display shelves by 4:30 PM.'
    ]

    res.status(200).json({
      success: true,
      data: {
        liveQueue: {
          activeShoppers,
          estimatedWaitMinutes,
          congestionLevel,
          activeKiosks
        },
        weeklyFootfall,
        hourlyRush,
        aiRecommendations,
        peakDay: 'Saturday (42% traffic)',
        generatedAt: new Date().toISOString()
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}