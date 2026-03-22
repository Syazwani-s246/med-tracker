// Pure JS insight generation — no AI, no backend

function countByName(logs) {
  return logs.reduce((acc, l) => {
    acc[l.name] = (acc[l.name] || 0) + 1
    return acc
  }, {})
}

function getHour(log) {
  return new Date(log.timestamp).getHours()
}

function timeOfDay(hour) {
  if (hour < 6) return 'early morning'
  if (hour < 12) return 'mornings'
  if (hour < 17) return 'afternoons'
  if (hour < 21) return 'evenings'
  return 'nights'
}

function mostCommonTimeOfDay(logs) {
  const counts = {}
  for (const log of logs) {
    const tod = timeOfDay(getHour(log))
    counts[tod] = (counts[tod] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
}

function effectRate(logs, name) {
  const relevant = logs.filter((l) => l.name === name && l.effect !== 'unknown')
  if (relevant.length === 0) return null
  const helped = relevant.filter((l) => l.effect === 'helped').length
  return Math.round((helped / relevant.length) * 100)
}

function countMedFreeDays(logs, days) {
  const usedDays = new Set(logs.map((l) => new Date(l.timestamp).toDateString()))
  const totalDays = days
  return totalDays - usedDays.size
}

function uniqueDays(logs) {
  return new Set(logs.map((l) => new Date(l.timestamp).toDateString())).size
}

export function generateInsights(logs, period = 'week') {
  const days = period === 'week' ? 7 : 30
  const insights = []
  const overuse = []

  if (logs.length === 0) {
    return {
      insights: ["No medication logs found for this period. Stay healthy! \uD83C\uDF3F"],
      overuse: [],
    }
  }

  const counts = countByName(logs)
  const tod = mostCommonTimeOfDay(logs)
  const medFreeDays = countMedFreeDays(logs, days)
  const label = period === 'week' ? 'This week' : 'This month'

  // Per-medication insights
  for (const [name, count] of Object.entries(counts)) {
    insights.push(`${label}, you took ${name} ${count} time${count > 1 ? 's' : ''}.`)

    const rate = effectRate(logs, name)
    if (rate !== null && logs.filter((l) => l.name === name && l.effect !== 'unknown').length >= 2) {
      insights.push(`${name} helped you ${rate}% of the time.`)
    }

    // Overuse nudge: more than 5x in 7 days
    if (period === 'week' && count > 5) {
      overuse.push(
        `You've taken ${name} ${count} times in the last 7 days. If the pain persists, it might be worth speaking to a doctor. \uD83D\uDC9B`
      )
    }
  }

  // Time of day insight
  if (tod) {
    insights.push(`You most often take medication in the ${tod}.`)
  }

  // Med-free days
  if (medFreeDays > 0) {
    insights.push(
      `You had ${medFreeDays} medication-free day${medFreeDays > 1 ? 's' : ''} ${period === 'week' ? 'this week' : 'this month'} \u2014 great job! \uD83C\uDF3F`
    )
  }

  // Total unique days with meds
  const activeDays = uniqueDays(logs)
  if (activeDays > 0) {
    insights.push(`You logged medications on ${activeDays} day${activeDays > 1 ? 's' : ''} ${period === 'week' ? 'this week' : 'this month'}.`)
  }

  return { insights, overuse }
}
