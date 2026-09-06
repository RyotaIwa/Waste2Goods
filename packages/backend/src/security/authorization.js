const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  BARANGAY_ADMIN: 'barangay_admin',
  RESIDENT: 'resident',
  KIOSK: 'kiosk',
  ANON: 'anon',
});

const RESOURCES = Object.freeze([
  'user', 'reward', 'redemption', 'transaction', 'kiosk', 'admin',
  'analytics', 'leaderboard', 'notification', 'task', 'kiosk_session',
]);

const ACTIONS = Object.freeze(['list', 'read', 'create', 'update', 'delete', 'calibrate', 'approve', 'status']);

const PERMISSION_MATRIX = {
  [ROLES.SUPER_ADMIN]: {
    user:          { list: true, read: true, create: true, update: true, delete: true, status: true },
    reward:        { list: true, read: true, create: true, update: true, delete: true },
    redemption:    { list: true, read: true, approve: true, status: true },
    transaction:   { list: true, read: true, create: true, delete: true },
    kiosk:         { list: true, read: true, calibrate: true, status: true },
    admin:         { list: true, read: true, create: true, update: true, delete: true, status: true },
    analytics:     { list: true, read: true },
    leaderboard:   { list: true, read: true },
    notification:  { list: true, read: true, create: true, delete: true },
    task:          { list: true, read: true, create: true, update: true, delete: true },
    kiosk_session: { list: true, read: true, create: true, delete: true },
  },
  [ROLES.ADMIN]: {
    user:          { list: true, read: true, create: true, update: true, delete: false, status: true },
    reward:        { list: true, read: true, create: true, update: true, delete: true },
    redemption:    { list: true, read: true, approve: true, status: true },
    transaction:   { list: true, read: true, create: true, delete: false },
    kiosk:         { list: true, read: true, calibrate: true, status: true },
    admin:         { list: true, read: true, create: false, update: false, delete: false, status: false },
    analytics:     { list: true, read: true },
    leaderboard:   { list: true, read: true },
    notification:  { list: true, read: true, create: true, delete: false },
    task:          { list: true, read: true, create: true, update: true, delete: false },
    kiosk_session: { list: true, read: true, create: true, delete: true },
  },
  [ROLES.BARANGAY_ADMIN]: {
    user:          { list: true, read: true, create: true, update: true, delete: false, status: false },
    reward:        { list: true, read: true, create: false, update: false, delete: false },
    redemption:    { list: true, read: true, approve: false, status: false },
    transaction:   { list: true, read: true, create: true, delete: false },
    kiosk:         { list: true, read: true, calibrate: false, status: false },
    admin:         { list: false, read: false, create: false, update: false, delete: false },
    analytics:     { list: true, read: true },
    leaderboard:   { list: true, read: true },
    notification:  { list: true, read: true, create: false, delete: false },
    task:          { list: true, read: true, create: false, update: false, delete: false },
    kiosk_session: { list: false, read: false, create: true, delete: false },
  },
  [ROLES.RESIDENT]: {
    user:          { list: false, read: true, create: false, update: false, delete: false, status: false },
    reward:        { list: true, read: true, create: false, update: false, delete: false },
    redemption:    { list: false, read: true, create: true, status: false },
    transaction:   { list: false, read: true, create: false, delete: false },
    kiosk:         { list: true, read: true, calibrate: false, status: false },
    admin:         { list: false, read: false, create: false, update: false, delete: false },
    analytics:     { list: false, read: false },
    leaderboard:   { list: true, read: true },
    notification:  { list: true, read: true, create: false, delete: true },
    task:          { list: true, read: true, create: false, update: false, delete: false },
    kiosk_session: { list: false, read: true, create: true, delete: true },
  },
  [ROLES.KIOSK]: {
    user:          { list: false, read: true, create: false, update: false, delete: false },
    reward:        { list: true, read: true },
    redemption:    { list: true, read: true, status: true },
    transaction:   { list: false, read: false, create: true, delete: false },
    kiosk:         { list: true, read: true },
    kiosk_session: { list: true, read: true, create: true, delete: true, status: true },
    leaderboard:   { list: true, read: true },
    notification:  { list: true, read: true },
  },
  [ROLES.ANON]: {
    user:          { read: false },
    reward:        { list: true, read: true },
    leaderboard:   { list: true, read: true },
    kiosk:         { list: true, read: true },
  },
};

const SUPER_ADMIN_IDS = new Set(['A-001']);

export function normalizeRole(rawRole) {
  if (!rawRole) return ROLES.ANON;
  const r = String(rawRole).toLowerCase().trim();
  if (r === 'super_admin' || SUPER_ADMIN_IDS.has(String(rawRole).toUpperCase())) return ROLES.SUPER_ADMIN;
  if (r === 'admin') return ROLES.ADMIN;
  if (r === 'barangay_admin') return ROLES.BARANGAY_ADMIN;
  if (r === 'resident') return ROLES.RESIDENT;
  if (r === 'kiosk') return ROLES.KIOSK;
  return ROLES.ANON;
}

export function hasRole(user, roles) {
  if (!user) return false;
  const r = normalizeRole(user.role);
  return (Array.isArray(roles) ? roles : [roles]).some((allow) => normalizeRole(allow) === r);
}

export function can(user, action, resource, attributes = {}) {
  if (!resource || !action) return false;
  const role = normalizeRole(user?.role || ROLES.ANON);
  const res = String(resource).toLowerCase();
  const act = String(action).toLowerCase();
  const row = (PERMISSION_MATRIX[role] || {})[res] || {};
  const baseAllow = Boolean(row[act]);
  if (!baseAllow) return { allow: false, reason: `role ${role} cannot ${act} on ${res}`, role, action: act, resource: res };

  const selfCheck = attributes?.resourceOwnerId && (user?.userId || user?.adminId || user?.kioskId);
  if (selfCheck && !isOwner(user, attributes.resourceOwnerId, attributes.resourceType)) {
    if (role === ROLES.RESIDENT || role === ROLES.KIOSK) {
      return { allow: false, reason: `resource ownership mismatch for ${role}`, role, action: act, resource: res };
    }
  }

  if (attributes?.barangayId && user?.barangayId && (role === ROLES.BARANGAY_ADMIN || role === ROLES.ADMIN)) {
    if (String(attributes.barangayId) !== String(user.barangayId) && role === ROLES.BARANGAY_ADMIN) {
      return { allow: false, reason: 'barangay scope mismatch', role, action: act, resource: res };
    }
  }

  if (attributes?.targetId) {
    const protectedId = String(attributes.targetId).toUpperCase();
    if (SUPER_ADMIN_IDS.has(protectedId) && role !== ROLES.SUPER_ADMIN) {
      return { allow: false, reason: 'super-admin resource protected', role, action: act, resource: res };
    }
  }

  return { allow: true, reason: 'allowed by permission matrix', role, action: act, resource: res };
}

export function isOwner(user, resourceOwnerId, resourceType = null) {
  if (!user || !resourceOwnerId) return false;
  const owner = String(resourceOwnerId);
  const subIds = new Set([
    user.userId, user.adminId, user.kioskId, user.sub,
  ].filter(Boolean).map((s) => String(s)));
  if (subIds.has(owner)) return true;
  if (resourceType === 'notification' && user.userId && owner.endsWith(String(user.userId))) return true;
  return false;
}

export function requirePermission(action, resource, opts = {}) {
  return function requirePermissionMiddleware(req, res, next) {
    const user = req.user || { role: 'anon' };
    const attrs = {
      resourceOwnerId: opts?.ownerFromParams ? req.params?.[opts.ownerFromParams] : opts?.owner,
      resourceType: resource,
      barangayId: opts?.barangayFromBody ? req.body?.barangayId : opts?.barangayId,
      targetId: opts?.targetFromParams ? req.params?.[opts.targetFromParams] : opts?.targetId,
    };
    const result = can(user, action, resource, attrs);
    if (!result.allow) {
      return res.status(403).json({
        error: `Forbidden — ${result.reason}`,
        code: 'PERMISSION_DENIED',
        details: result,
      });
    }
    req.permission = result;
    next();
  };
}

export function requireOwnershipOrRole(rolesAllowed, ownerParamKey = 'id', idKey = 'userId') {
  return function requireOwnershipOrRoleMiddleware(req, res, next) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    if (hasRole(user, rolesAllowed)) return next();
    const resourceOwnerId = String(req.params?.[ownerParamKey] || req.body?.[idKey] || '');
    if (isOwner(user, resourceOwnerId)) return next();
    return res.status(403).json({
      error: `Forbidden — requires ownership or one of: ${[].concat(rolesAllowed).join(', ')}`,
      code: 'OWNER_OR_ROLE_REQUIRED',
    });
  };
}

export function authorizationPolicyInfo() {
  return {
    roles: Object.values(ROLES),
    resources: RESOURCES,
    actions: ACTIONS,
    matrix: PERMISSION_MATRIX,
    protectedAccounts: Array.from(SUPER_ADMIN_IDS),
    evaluationOrder: [
      '1) authenticateJWT() — attach req.user',
      '2) requirePermission(action, resource, attrs) — matrix check',
      '3) barangay-scope attribute check (barangay_admin scoped to their barangayId)',
      '4) ownership check (resident/kiosk can only modify OWN resources)',
      '5) super-admin ID protection (only super_admin can archive A-001)',
    ],
  };
}

export default {
  ROLES, RESOURCES, ACTIONS, PERMISSION_MATRIX,
  normalizeRole, hasRole, can, isOwner,
  requirePermission, requireOwnershipOrRole, authorizationPolicyInfo,
};
