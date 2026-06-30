import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { upsertDailyLog } from './dailyLogs'
import { isDateKey, todayDateKey } from './format'
import {
  db,
  getLocalAppState,
  getPendingChangeCount,
  importAppState,
  initializeLocalData,
  nowIso,
  putDailyLog,
  putReward,
  putSpinClaim,
  putTarget,
  softDeleteRecord,
} from './localDb'
import { createInitialState } from './storage'
import { syncWithSupabase } from './sync'
import { supabase, supabaseIsConfigured } from './supabaseClient'
import {
  getLockedLogIds,
  getLockedTargetIds,
  getTargetProgressSummary,
  reconcileTargetProgress,
} from './targetProgress'
import type {
  AppState,
  RewardHistoryItem,
  RewardItem,
  SyncStatus,
} from './types'

export function usePersonalBankState() {
  const [state, setState] = useState(() =>
    reconcileTargetProgress(createInitialState()),
  )
  const [selectedDate, setSelectedDate] = useState(todayDateKey)
  const [dailyAmount, setDailyAmount] = useState(0)
  const [targetAmount, setTargetAmount] = useState(4000)
  const [rewardLabel, setRewardLabel] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading')
  const [pendingChangeCount, setPendingChangeCount] = useState(0)
  const syncingRef = useRef(false)
  const userId = session?.user.id

  const refreshLocalState = useCallback(async () => {
    const localState = await getLocalAppState()
    const reconciledState = reconcileTargetProgress(localState)

    setState(reconciledState)
    setPendingChangeCount(await getPendingChangeCount())

    return reconciledState
  }, [])

  const syncNow = useCallback(async () => {
    if (!userId || !supabaseIsConfigured) {
      setSyncStatus('local')
      return
    }

    if (!navigator.onLine) {
      setSyncStatus('offline')
      return
    }

    if (syncingRef.current) return

    syncingRef.current = true
    setSyncStatus('syncing')

    try {
      await syncWithSupabase(userId)
      await refreshLocalState()
      setSyncStatus('synced')
    } catch {
      setSyncStatus('error')
    } finally {
      syncingRef.current = false
      setPendingChangeCount(await getPendingChangeCount())
    }
  }, [refreshLocalState, userId])

  useEffect(() => {
    let active = true

    async function initialize() {
      await initializeLocalData()
      if (!active) return

      await refreshLocalState()

      if (!supabase) {
        setSyncStatus('local')
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!active) return

      setSession(data.session)
      setSyncStatus(data.session ? 'syncing' : 'local')
    }

    void initialize()

    return () => {
      active = false
    }
  }, [refreshLocalState])

  useEffect(() => {
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthMessage('')
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    void syncNow()
  }, [syncNow])

  useEffect(() => {
    function syncWhenOnline() {
      void syncNow()
    }

    window.addEventListener('online', syncWhenOnline)
    window.addEventListener('focus', syncWhenOnline)

    return () => {
      window.removeEventListener('online', syncWhenOnline)
      window.removeEventListener('focus', syncWhenOnline)
    }
  }, [syncNow])

  useEffect(() => {
    const selectedLog = state.dailyLogs.find((log) => log.date === selectedDate)
    setDailyAmount(selectedLog?.amount ?? 0)
  }, [selectedDate, state.dailyLogs])

  const targetProgress = useMemo(
    () => getTargetProgressSummary(state.dailyLogs, state.targets),
    [state.dailyLogs, state.targets],
  )
  const lockedLogIds = useMemo(
    () => getLockedLogIds(state.dailyLogs, state.targets, state.spentTargetIds),
    [state.dailyLogs, state.spentTargetIds, state.targets],
  )
  const lockedTargetIds = useMemo(
    () => getLockedTargetIds(state.spentTargetIds),
    [state.spentTargetIds],
  )
  const selectedLog = state.dailyLogs.find((log) => log.date === selectedDate)
  const selectedLogIsLocked = selectedLog
    ? lockedLogIds.has(selectedLog.id)
    : false

  async function afterLocalChange(nextState?: AppState) {
    if (nextState) {
      setState(reconcileTargetProgress(nextState))
      setPendingChangeCount(await getPendingChangeCount())
    } else {
      await refreshLocalState()
    }

    void syncNow()
  }

  function saveDailyLog() {
    if (!isDateKey(selectedDate)) return
    if (selectedDate !== todayDateKey()) return
    if (selectedLogIsLocked) return

    const amount = Math.max(0, Number(dailyAmount) || 0)
    const dailyLogs = upsertDailyLog(state.dailyLogs, selectedDate, amount)
    const log = dailyLogs.find((entry) => entry.date === selectedDate)
    if (!log) return

    void (async () => {
      await putDailyLog(log)
      await afterLocalChange({ ...state, dailyLogs })
    })()
  }

  function addTarget() {
    const amount = Math.max(1, Number(targetAmount) || 0)
    if (state.targets.some((target) => target.amount === amount)) return

    const timestamp = nowIso()
    const target = {
      id: crypto.randomUUID(),
      amount,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    }

    void (async () => {
      await putTarget(target)
      await afterLocalChange({
        ...state,
        targets: [...state.targets, target],
      })
      setTargetAmount(amount + 1000)
    })()
  }

  function removeTarget(id: string) {
    if (lockedTargetIds.has(id)) return

    void (async () => {
      await softDeleteRecord('targets', id)
      await afterLocalChange({
        ...state,
        targets: state.targets.filter((target) => target.id !== id),
      })
    })()
  }

  function removeDailyLog(id: string) {
    if (lockedLogIds.has(id)) return

    void (async () => {
      await softDeleteRecord('dailyLogs', id)
      await afterLocalChange({
        ...state,
        dailyLogs: state.dailyLogs.filter((entry) => entry.id !== id),
      })
    })()
  }

  function addReward() {
    const label = rewardLabel.trim()
    if (!label) return

    const timestamp = nowIso()
    const reward = {
      id: crypto.randomUUID(),
      label,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    }

    void (async () => {
      await putReward(reward)
      await afterLocalChange({
        ...state,
        rewards: [...state.rewards, reward],
      })
      setRewardLabel('')
    })()
  }

  function removeReward(id: string) {
    void (async () => {
      await softDeleteRecord('rewards', id)
      await afterLocalChange({
        ...state,
        rewards: state.rewards.filter((reward) => reward.id !== id),
      })
    })()
  }

  function spendAvailableSpin() {
    return state.spins > 0
  }

  function recordReward(reward: RewardItem) {
    const targetId = getNextSpendableTargetId(state)
    const timestamp = nowIso()
    const earnedReward: RewardHistoryItem = {
      id: crypto.randomUUID(),
      targetId,
      rewardId: reward.id,
      rewardLabel: reward.label,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    }

    void (async () => {
      await putSpinClaim(earnedReward)
      await afterLocalChange({
        ...state,
        history: [earnedReward, ...state.history],
        spentTargetIds: targetId
          ? [...state.spentTargetIds, targetId]
          : state.spentTargetIds,
        spentSpinCount: state.spentSpinCount + 1,
      })
    })()

    return earnedReward
  }

  function resetBank() {
    const nextState = createInitialState()

    void (async () => {
      const [targets, dailyLogs, rewards, spinClaims] = await Promise.all([
        db.targets.toArray(),
        db.dailyLogs.toArray(),
        db.rewards.toArray(),
        db.spinClaims.toArray(),
      ])

      await Promise.all([
        ...targets.map((record) => softDeleteRecord('targets', record.id)),
        ...dailyLogs.map((record) => softDeleteRecord('dailyLogs', record.id)),
        ...rewards.map((record) => softDeleteRecord('rewards', record.id)),
        ...spinClaims.map((record) => softDeleteRecord('spinClaims', record.id)),
      ])
      await importAppState(nextState, { queueUpload: true })
      await afterLocalChange(nextState)
    })()

    setState(reconcileTargetProgress(nextState))
    setSelectedDate(todayDateKey())
    setDailyAmount(0)
  }

  function updateSelectedDate(value: string) {
    if (isDateKey(value) && value === todayDateKey()) setSelectedDate(value)
  }

  async function signInWithEmail() {
    const email = authEmail.trim()
    if (!email || !supabase) return

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })

    setAuthMessage(
      error ? error.message : 'Check your email for the login link.',
    )
  }

  async function signOut() {
    if (!supabase) return

    await supabase.auth.signOut()
    setSession(null)
    setSyncStatus('local')
  }

  return {
    addReward,
    addTarget,
    authEmail,
    authMessage,
    dailyAmount,
    isSupabaseConfigured: supabaseIsConfigured,
    lockedLogIds,
    lockedTargetIds,
    pendingChangeCount,
    recordReward,
    removeDailyLog,
    removeReward,
    removeTarget,
    resetBank,
    rewardLabel,
    saveDailyLog,
    selectedDate,
    selectedLogIsLocked,
    session,
    setAuthEmail,
    setDailyAmount,
    setRewardLabel,
    setTargetAmount,
    signInWithEmail,
    signOut,
    spendAvailableSpin,
    state,
    syncNow,
    syncStatus,
    targetAmount,
    targetProgress,
    updateSelectedDate,
  }
}

function getNextSpendableTargetId(current: AppState) {
  const spentTargetIds = new Set(current.spentTargetIds)

  return [...current.targets]
    .filter(
      (target) =>
        current.unlockedTargetIds.includes(target.id) &&
        !spentTargetIds.has(target.id),
    )
    .sort((a, b) => a.amount - b.amount)[0]?.id
}
