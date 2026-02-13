/**
 * Core type definitions for fptcore.
 *
 * These interfaces describe the domain model for scripts, trips, players,
 * and the kernel that evaluates them at runtime.
 */

import type moment from 'moment';

// ---------------------------------------------------------------------------
// Script content: the static definition of an experience
// ---------------------------------------------------------------------------

/** A named resource in a script collection (role, scene, page, etc). */
export interface NamedResource {
  name: string;
  title?: string;
  [key: string]: unknown;
}

export interface ScriptRole extends NamedResource {
  interface?: string;
}

export interface ScriptScene extends NamedResource {
  global?: boolean;
}

export interface ScriptPage extends NamedResource {
  scene?: string;
  interface?: string;
  directive?: string;
  panels?: ComponentValue[];
}

export interface ScriptTime extends NamedResource {
  title: string;
}

export interface ScriptVariant extends NamedResource {
  default?: boolean;
  customizations?: Record<string, SimpleValue>;
  waypoint_options?: Record<string, string>;
  initial_values?: Record<string, SimpleValue>;
  schedule?: Record<string, string>;
}

export interface WaypointOption extends NamedResource {
  location?: Location;
  values?: Record<string, SimpleValue>;
}

export interface ScriptWaypoint extends NamedResource {
  options: WaypointOption[];
}

export interface ScriptGeofence extends NamedResource {
  center: string;
  distance: number;
}

export interface ScriptTrigger extends NamedResource {
  scene?: string;
  event?: ComponentValue;
  if?: ComponentValue;
  actions?: TriggerAction[];
  elseifs?: TriggerElseIf[];
  else?: TriggerAction[];
}

export interface ScriptRelay extends NamedResource {
  for: string;
}

export interface ScriptContentPage extends NamedResource {
  interface?: string;
  section?: string;
  visible_if?: ComponentValue;
  panels?: ComponentValue[];
}

export interface ScriptCue extends NamedResource {}

/** The full script content object – a collection of named resource arrays. */
export interface ScriptContent {
  meta?: { version: number };
  roles?: ScriptRole[];
  scenes?: ScriptScene[];
  pages?: ScriptPage[];
  times?: ScriptTime[];
  triggers?: ScriptTrigger[];
  variants?: ScriptVariant[];
  waypoints?: ScriptWaypoint[];
  geofences?: ScriptGeofence[];
  relays?: ScriptRelay[];
  cues?: ScriptCue[];
  content_pages?: ScriptContentPage[];
  routes?: NamedResource[];
  clips?: NamedResource[];
  inboxes?: NamedResource[];
  [collectionName: string]: unknown;
}

/** A script record wrapping the content with metadata. */
export interface Script {
  name: string;
  content: ScriptContent;
}

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export interface Location {
  title?: string;
  address?: string;
  coords: [number, number];
}

// ---------------------------------------------------------------------------
// Trip state: the dynamic runtime state of an experience
// ---------------------------------------------------------------------------

export interface TripState {
  currentSceneName: string;
  currentPageNamesByRole: Record<string, string>;
  audioStateByRole?: Record<string, AudioState | null>;
}

export interface AudioState {
  title?: string;
  url: string;
  startedAt: string;
  startedTime: number;
  pausedTime: number | null;
  isPlaying: boolean;
}

export interface TripFields {
  tripState: TripState;
  customizations: Record<string, SimpleValue>;
  values: Record<string, SimpleValue>;
  waypointOptions: Record<string, string>;
  schedule: Record<string, string>;
}

export interface Participant {
  name?: string;
  email?: string;
  phoneNumber?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationAccuracy?: number;
  locationTimestamp?: string;
  profile?: { values?: Record<string, SimpleValue> };
}

export interface Player {
  id?: number;
  roleName: string;
  acknowledgedPageName?: string;
  acknowledgedPageAt?: string | null;
  participant?: Participant;
}

export interface Trip {
  id?: number;
  date?: string;
  script: Script;
  tripState: TripState;
  schedule?: Record<string, string>;
  customizations?: Record<string, SimpleValue>;
  values?: Record<string, SimpleValue>;
  waypointOptions?: Record<string, string>;
  history?: Record<string, string>;
  players?: Player[];
}

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export interface Env {
  host?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Kernel types: evaluation context and results
// ---------------------------------------------------------------------------

/**
 * The context object passed around during kernel evaluation.
 * It carries both the static script content and the current dynamic state
 * (via evalContext), plus metadata about the triggering event.
 */
export interface ActionContext {
  scriptContent: ScriptContent;
  evalContext: EvalContext;
  evaluateAt: moment.Moment;
  timezone?: string;
  triggeringRoleName?: string;
  /** Template-text helper (injected by HQ action_context) */
  templateText?: (text: string) => string;
  /** Condition evaluator (injected by HQ action_context) */
  if?: (condition: ComponentValue) => boolean;
  /** Registry (injected by HQ action_context) */
  registry?: Registry;
  [key: string]: unknown;
}

/**
 * The eval context is the flattened view of all trip state used for
 * template interpolation and condition evaluation. It is a superset of
 * trip fields, schedule, history, and per-role player contexts.
 */
export interface EvalContext {
  tripState: TripState;
  waypointOptions?: Record<string, string>;
  schedule?: Record<string, string>;
  history?: Record<string, string>;
  roleStates?: Record<string, PlayerEvalContext[]>;
  date?: string;
  event?: Event | null;
  [key: string]: unknown;
}

export interface PlayerEvalContext {
  link: string;
  join_link: string;
  contact_name: string | null;
  user_name?: string;
  participant_name?: string;
  first_name: string;
  phone_number: string | null;
  directive: string | null;
  headline: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  location_accuracy: number | null;
  location_timestamp: string | null;
  [key: string]: unknown;
}

/** A runtime event emitted by an action or triggered externally. */
export interface Event {
  type: string;
  [key: string]: unknown;
}

/** An unpacked action ready for kernel execution. */
export interface KernelAction {
  name: string;
  params: Record<string, unknown>;
  event?: Event;
}

/**
 * A result op is a single side-effect produced by the kernel.
 * The `operation` field determines which handler processes it.
 */
export interface ResultOp {
  operation: string;
  [key: string]: unknown;
}

/** A scheduled action to be executed later. */
export interface ScheduledAction {
  name: string;
  params: Record<string, unknown>;
  scheduleAt: Date;
  triggerName: string;
  event?: Event;
}

/** The result of processing one or more actions through the kernel. */
export interface KernelResult {
  nextContext: ActionContext;
  resultOps: ResultOp[];
  scheduledActions: ScheduledAction[];
}

// ---------------------------------------------------------------------------
// Trigger actions and clauses
// ---------------------------------------------------------------------------

export interface TriggerAction {
  name?: string;
  id?: number;
  if?: ComponentValue;
  actions?: TriggerAction[];
  elseifs?: TriggerElseIf[];
  else?: TriggerAction[];
  [key: string]: unknown;
}

export interface TriggerElseIf {
  if: ComponentValue;
  actions: TriggerAction[];
}

// ---------------------------------------------------------------------------
// Param specs: the schema system for describing resource/component fields
// ---------------------------------------------------------------------------

export type ParamSpecType =
  | 'string' | 'email' | 'markdown' | 'name' | 'media'
  | 'integer' | 'number' | 'boolean' | 'color'
  | 'simpleValue' | 'simpleAttribute' | 'lookupable'
  | 'timeOffset' | 'timeShorthand' | 'coords' | 'location'
  | 'enum' | 'reference' | 'componentReference'
  | 'component' | 'list' | 'dictionary' | 'object';

export interface ParamSpec {
  type: ParamSpecType;
  required?: boolean;
  help?: string;
  title?: string;
  display?: Record<string, unknown>;
  default?: unknown;
  // enum
  options?: string[];
  // reference
  collection?: string;
  specialValues?: Array<string | { value: string; label: string }>;
  // component
  component?: string;
  // componentReference
  componentType?: string;
  componentVariant?: string;
  // list
  items?: ParamSpec;
  // dictionary
  keys?: ParamSpec;
  values?: ParamSpec;
  // object
  properties?: Record<string, ParamSpec>;
  // misc
  medium?: string;
  parent?: boolean;
  [key: string]: unknown;
}

export type ParamSpecs = Record<string, ParamSpec>;

// ---------------------------------------------------------------------------
// Resource and component classes (registry entries)
// ---------------------------------------------------------------------------

/** A resource class describes a top-level script collection item. */
export interface ResourceClass {
  title?: string;
  icon?: string;
  help?: string;
  properties: ParamSpecs;
  validateResource?: (scriptContent: ScriptContent, resource: NamedResource) => string[] | undefined;
  [key: string]: unknown;
}

/** An action class implements a single action (e.g. send_text). */
export interface ActionClass {
  title?: string;
  help?: string;
  params: ParamSpecs;
  getOps: (params: Record<string, unknown>, actionContext: ActionContext) => ResultOp[];
  [key: string]: unknown;
}

/** An event class implements event matching for a trigger. */
export interface EventClass {
  title?: string;
  help?: string;
  specParams: ParamSpecs;
  matchEvent: (spec: ComponentValue, event: Event, actionContext: ActionContext) => boolean;
  getTitle?: (scriptContent: ScriptContent, spec: ComponentValue, ...args: unknown[]) => string | null;
  timeForSpec?: (spec: ComponentValue, evalContext: EvalContext) => moment.Moment | null;
  getRef?: (scriptContent: ScriptContent, spec: ComponentValue, event: Event) => string | null;
  [key: string]: unknown;
}

/** A panel class implements a UI panel type. */
export interface PanelClass {
  title?: string;
  icon?: string;
  help?: string;
  properties: ParamSpecs;
  export?: (panel: ComponentValue, actionContext: ActionContext) => Record<string, unknown> | null;
  getTitle?: (resource: NamedResource, component: ComponentValue, scriptContent: ScriptContent) => string;
  validateResource?: (scriptContent: ScriptContent, resource: NamedResource) => string[] | undefined;
  [key: string]: unknown;
}

/** A condition class implements a boolean condition. */
export interface ConditionClass {
  title?: string;
  help?: string;
  display?: Record<string, unknown>;
  properties: ParamSpecs;
  eval: (params: ComponentValue, actionContext: ActionContext, subIf?: SubIfFn) => boolean;
  [key: string]: unknown;
}

export type SubIfFn = (actionContext: ActionContext, condition: ComponentValue) => boolean;

/** Lookup value that is a simple scalar or a templated reference. */
export type SimpleValue = string | number | boolean | null;

/** A component value is an object with a type discriminator key. */
export interface ComponentValue {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Component definitions: describe a polymorphic component family
// ---------------------------------------------------------------------------

export interface ComponentDef {
  typeKey: string;
  propertiesKey: string;
  common?: {
    display?: Record<string, unknown>;
    properties?: ParamSpecs;
  };
}

export type ComponentDefs = Record<string, ComponentDef>;

// ---------------------------------------------------------------------------
// Module definition: a group of related resources
// ---------------------------------------------------------------------------

export interface ModuleResourceDef {
  resource?: ResourceClass | null;
  actions?: Record<string, ActionClass>;
  events?: Record<string, EventClass>;
  panels?: Record<string, PanelClass>;
  conditions?: Record<string, ConditionClass>;
}

export interface ModuleDef {
  name: string;
  resources?: Record<string, ModuleResourceDef>;
  // Populated at registry load time
  actions?: Record<string, ActionClass>;
  events?: Record<string, EventClass>;
  panels?: Record<string, PanelClass>;
  conditions?: Record<string, ConditionClass>;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export interface Registry {
  modules: Record<string, ModuleDef>;
  resources: Record<string, ResourceClass>;
  components: ComponentDefs;
  actions: Record<string, ActionClass>;
  events: Record<string, EventClass>;
  panels: Record<string, PanelClass>;
  conditions: Record<string, ConditionClass>;
  _cache: Record<string, ResourceClass>;

  getComponentVarietyByType(componentType: string, value: ComponentValue | null): string | null;
  getComponentVariety(spec: ParamSpec, value: ComponentValue | null): string | null;
  getComponentClassByType(componentType: string, variety: string | null): ResourceClass;
  getComponentClass(spec: ParamSpec, variety: string | null): ResourceClass;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationEntry {
  title?: string;
  help?: string;
  validate: (scriptContent: ScriptContent, name: string, spec: ParamSpec, param: unknown) => string[] | undefined;
}

export type Validations = Record<string, ValidationEntry>;

// ---------------------------------------------------------------------------
// Migrator
// ---------------------------------------------------------------------------

export interface Migration {
  num: number;
  name: string;
  migrations: MigrationFns;
  tests?: MigrationTest[];
}

export type MigrationFn = (...args: any[]) => void;
export type MigrationFns = Record<string, MigrationFn> | Array<[string, MigrationFn]>;

export interface MigrationTest {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Script validation error
// ---------------------------------------------------------------------------

export interface FieldError {
  path: string;
  collection: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Page info (returned by PlayerCore)
// ---------------------------------------------------------------------------

export interface PageInfo {
  page: ScriptPage;
  scene: ScriptScene;
  statusClass: string;
  status: string;
}
