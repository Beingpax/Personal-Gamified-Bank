import { db, type LocalDailyLog, type LocalReward, type LocalSpinClaim, type LocalTarget } from './localDb'
import { supabase } from './supabaseClient'

type RemoteTarget = {
  id: string
  user_id: string
  amount: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type RemoteDailyLog = {
  id: string
  user_id: string
  log_date: string
  amount: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type RemoteReward = {
  id: string
  user_id: string
  label: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type RemoteSpinClaim = {
  id: string
  user_id: string
  target_id: string | null
  reward_id: string
  reward_label_snapshot: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export async function syncWithSupabase(userId: string) {
  if (!supabase) return

  await pushPendingChanges(userId)
  await pullRemoteChanges(userId)
}

async function pushPendingChanges(userId: string) {
  if (!supabase) return

  const changes = await db.pendingChanges.orderBy('createdAt').toArray()

  for (const change of changes) {
    const payload = change.payload as Record<string, unknown>
    const updatedAt = String(payload.updatedAt ?? new Date().toISOString())
    const deletedAt =
      change.action === 'delete'
        ? String(payload.deletedAt ?? updatedAt)
        : (payload.deletedAt as string | null | undefined) ?? null

    if (change.action === 'delete') {
      const { error } = await supabase
        .from(remoteTableName(change.table))
        .update({ updated_at: updatedAt, deleted_at: deletedAt })
        .eq('id', change.recordId)
        .eq('user_id', userId)

      if (error) throw error
      await db.pendingChanges.delete(change.id)
      continue
    }

    if (change.table === 'targets') {
      const { error } = await supabase
        .from('personal_bank_targets')
        .upsert(toRemoteTarget(payload as unknown as LocalTarget, userId))

      if (error) throw error
    } else if (change.table === 'dailyLogs') {
      const { error } = await supabase
        .from('personal_bank_daily_logs')
        .upsert(toRemoteDailyLog(payload as unknown as LocalDailyLog, userId), {
          onConflict: 'user_id,log_date',
        })

      if (error) throw error
    } else if (change.table === 'rewards') {
      const { error } = await supabase
        .from('personal_bank_rewards')
        .upsert(toRemoteReward(payload as unknown as LocalReward, userId))

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('personal_bank_spin_claims')
        .upsert(
          toRemoteSpinClaim(payload as unknown as LocalSpinClaim, userId),
        )

      if (error) throw error
    }

    await db.pendingChanges.delete(change.id)
  }
}

async function pullRemoteChanges(userId: string) {
  if (!supabase) return

  const [targets, dailyLogs, rewards, spinClaims] = await Promise.all([
    supabase.from('personal_bank_targets').select('*').eq('user_id', userId),
    supabase
      .from('personal_bank_daily_logs')
      .select('*')
      .eq('user_id', userId),
    supabase.from('personal_bank_rewards').select('*').eq('user_id', userId),
    supabase
      .from('personal_bank_spin_claims')
      .select('*')
      .eq('user_id', userId),
  ])

  if (targets.error) throw targets.error
  if (dailyLogs.error) throw dailyLogs.error
  if (rewards.error) throw rewards.error
  if (spinClaims.error) throw spinClaims.error

  await Promise.all([
    mergeTargets((targets.data ?? []) as RemoteTarget[]),
    mergeDailyLogs((dailyLogs.data ?? []) as RemoteDailyLog[]),
    mergeRewards((rewards.data ?? []) as RemoteReward[]),
    mergeSpinClaims((spinClaims.data ?? []) as RemoteSpinClaim[]),
  ])
}

async function mergeTargets(records: RemoteTarget[]) {
  for (const record of records) {
    const local = await db.targets.get(record.id)
    const remote = fromRemoteTarget(record)

    if (!local || remote.updatedAt >= local.updatedAt) {
      await db.targets.put(remote)
    }
  }
}

async function mergeDailyLogs(records: RemoteDailyLog[]) {
  for (const record of records) {
    const local = await db.dailyLogs.get(record.id)
    const remote = fromRemoteDailyLog(record)

    if (!local || remote.updatedAt >= local.updatedAt) {
      await db.dailyLogs.put(remote)
    }
  }
}

async function mergeRewards(records: RemoteReward[]) {
  for (const record of records) {
    const local = await db.rewards.get(record.id)
    const remote = fromRemoteReward(record)

    if (!local || remote.updatedAt >= local.updatedAt) {
      await db.rewards.put(remote)
    }
  }
}

async function mergeSpinClaims(records: RemoteSpinClaim[]) {
  for (const record of records) {
    const local = await db.spinClaims.get(record.id)
    const remote = fromRemoteSpinClaim(record)

    if (!local || remote.updatedAt >= local.updatedAt) {
      await db.spinClaims.put(remote)
    }
  }
}

function remoteTableName(table: string) {
  if (table === 'targets') return 'personal_bank_targets'
  if (table === 'dailyLogs') return 'personal_bank_daily_logs'
  if (table === 'rewards') return 'personal_bank_rewards'

  return 'personal_bank_spin_claims'
}

function toRemoteTarget(record: LocalTarget, userId: string): RemoteTarget {
  return {
    id: record.id,
    user_id: userId,
    amount: record.amount,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    deleted_at: record.deletedAt,
  }
}

function toRemoteDailyLog(
  record: LocalDailyLog,
  userId: string,
): RemoteDailyLog {
  return {
    id: record.id,
    user_id: userId,
    log_date: record.date,
    amount: record.amount,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    deleted_at: record.deletedAt,
  }
}

function toRemoteReward(record: LocalReward, userId: string): RemoteReward {
  return {
    id: record.id,
    user_id: userId,
    label: record.label,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    deleted_at: record.deletedAt,
  }
}

function toRemoteSpinClaim(
  record: LocalSpinClaim,
  userId: string,
): RemoteSpinClaim {
  return {
    id: record.id,
    user_id: userId,
    target_id: record.targetId,
    reward_id: record.rewardId,
    reward_label_snapshot: record.rewardLabel,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    deleted_at: record.deletedAt,
  }
}

function fromRemoteTarget(record: RemoteTarget): LocalTarget {
  return {
    id: record.id,
    amount: record.amount,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    deletedAt: record.deleted_at,
  }
}

function fromRemoteDailyLog(record: RemoteDailyLog): LocalDailyLog {
  return {
    id: record.id,
    date: record.log_date,
    amount: record.amount,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    deletedAt: record.deleted_at,
  }
}

function fromRemoteReward(record: RemoteReward): LocalReward {
  return {
    id: record.id,
    label: record.label,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    deletedAt: record.deleted_at,
  }
}

function fromRemoteSpinClaim(record: RemoteSpinClaim): LocalSpinClaim {
  return {
    id: record.id,
    targetId: record.target_id,
    rewardId: record.reward_id,
    rewardLabel: record.reward_label_snapshot,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    deletedAt: record.deleted_at,
  }
}
