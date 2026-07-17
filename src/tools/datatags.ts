import { z } from "zod";
import { planfixGet, planfixPost } from "../client.js";
import { formatDatatagList } from "../format.js";

const DEFAULT_DATA_TAG_FIELDS = "id,name,group,fields";
const DEFAULT_ENTRY_FIELDS = "dataTag,key,commentId,task,contact";
const ACTUAL_WORK_TIME_DATA_TAG_ID = 28008;
const ACTUAL_WORK_TIME_FIELDS =
  "dataTag,key,commentId,task,contact,106950,106948,106944,106946,109380,109386";

const dataTagFilterSchema = z.record(z.unknown());

type CustomFieldValue = {
  field?: {
    id?: number;
    name?: string;
    type?: number;
  };
  value?: unknown;
  stringValue?: string;
};

type DataTagEntry = {
  key?: number;
  customFieldData?: CustomFieldValue[];
};

type EntriesResponse = {
  entries?: DataTagEntry[];
  dataTagEntries?: DataTagEntry[];
  entryList?: DataTagEntry[];
  [key: string]: unknown;
};

type TimeSummary = {
  totalMinutes: number | null;
  totalHours: number | null;
  matchedFields: Array<{ entryKey?: number; fieldId?: number; fieldName?: string; minutes: number }>;
  warning?: string;
};

export const getDataTagsSchema = z.object({
  offset: z.number().optional().describe("Смещение для пагинации (по умолчанию 0)"),
  pageSize: z.number().optional().describe("Количество аналитик на странице (по умолчанию 100)"),
  fields: z.string().optional().describe("Поля аналитики через запятую"),
});

export async function handleGetDataTags(params: z.infer<typeof getDataTagsSchema>): Promise<string> {
  const result = await planfixPost("datatag/list", {
    offset: params.offset ?? 0,
    pageSize: params.pageSize ?? 100,
    fields: params.fields ?? DEFAULT_DATA_TAG_FIELDS,
  });
  return JSON.stringify(result, null, 2);
}


export const listDatatagsSchema = getDataTagsSchema;

export async function handleListDatatags(params: z.infer<typeof listDatatagsSchema>): Promise<string> {
  const result = await planfixPost("datatag/list", {
    offset: params.offset ?? 0,
    pageSize: params.pageSize ?? 100,
    fields: params.fields ?? "id,name",
  });
  return formatDatatagList(result);
}

export const getDataTagSchema = z.object({
  dataTagId: z.number().describe("ID аналитики"),
  fields: z.string().optional().describe("Поля аналитики через запятую"),
});

export async function handleGetDataTag(params: z.infer<typeof getDataTagSchema>): Promise<string> {
  const fields = encodeURIComponent(params.fields ?? DEFAULT_DATA_TAG_FIELDS);
  const result = await planfixGet(`datatag/${params.dataTagId}?fields=${fields}`);
  return JSON.stringify(result, null, 2);
}

export const getDataTagFieldsSchema = z.object({
  dataTagId: z.number().describe("ID аналитики"),
  fields: z.string().optional().describe("Поля полей аналитики через запятую"),
});

export async function handleGetDataTagFields(params: z.infer<typeof getDataTagFieldsSchema>): Promise<string> {
  const fields = encodeURIComponent(params.fields ?? "id,name,type,objectType,groupId,directoryId,enumValues");
  const result = await planfixGet(`customfield/datatag/${params.dataTagId}?fields=${fields}`);
  return JSON.stringify(result, null, 2);
}

export const getDataTagEntrySchema = z.object({
  key: z.number().describe("Ключ записи аналитики"),
  fields: z.string().optional().describe("Поля записи аналитики через запятую"),
});

export async function handleGetDataTagEntry(params: z.infer<typeof getDataTagEntrySchema>): Promise<string> {
  const fields = encodeURIComponent(params.fields ?? DEFAULT_ENTRY_FIELDS);
  const result = await planfixGet(`datatag/entry/${params.key}?fields=${fields}`);
  return JSON.stringify(result, null, 2);
}

export const getDataTagEntriesSchema = z.object({
  dataTagId: z.number().describe("ID аналитики"),
  offset: z.number().optional().describe("Смещение для пагинации (по умолчанию 0)"),
  pageSize: z.number().optional().describe("Количество записей на странице (по умолчанию 100)"),
  fields: z.string().optional().describe("Поля записей аналитики через запятую"),
  taskId: z.number().optional().describe("ID задачи для фильтрации записей аналитики"),
  contactId: z.string().optional().describe("ID контакта для фильтрации записей аналитики"),
  filters: z.array(dataTagFilterSchema).optional().describe("Сложные фильтры Planfix для записей аналитики"),
});

export async function handleGetDataTagEntries(params: z.infer<typeof getDataTagEntriesSchema>): Promise<string> {
  const result = await fetchDataTagEntries(params);
  return JSON.stringify(result, null, 2);
}

export const getTaskActualWorkTimeSchema = z.object({
  taskId: z.number().describe("ID задачи"),
  dataTagId: z.number().optional().describe("ID аналитики фактического времени (по умолчанию 28008)"),
  offset: z.number().optional().describe("Смещение для пагинации (по умолчанию 0)"),
  pageSize: z.number().optional().describe("Количество записей на странице (по умолчанию 100)"),
  fields: z.string().optional().describe("Поля записей аналитики через запятую"),
});

export async function handleGetTaskActualWorkTime(params: z.infer<typeof getTaskActualWorkTimeSchema>): Promise<string> {
  const dataTagId = params.dataTagId ?? ACTUAL_WORK_TIME_DATA_TAG_ID;
  const fields = params.fields ?? (dataTagId === ACTUAL_WORK_TIME_DATA_TAG_ID ? ACTUAL_WORK_TIME_FIELDS : DEFAULT_ENTRY_FIELDS);
  const raw = await fetchAllDataTagEntries({
    dataTagId,
    taskId: params.taskId,
    offset: params.offset,
    pageSize: params.pageSize,
    fields,
  });

  return JSON.stringify(
    {
      dataTagId,
      taskId: params.taskId,
      summary: summarizeActualWorkTime(raw),
      raw,
    },
    null,
    2,
  );
}

async function fetchDataTagEntries(params: z.infer<typeof getDataTagEntriesSchema>): Promise<unknown> {
  const body: Record<string, unknown> = {
    offset: params.offset ?? 0,
    pageSize: params.pageSize ?? 100,
    fields: params.fields ?? DEFAULT_ENTRY_FIELDS,
  };
  if (params.taskId !== undefined) body.taskId = params.taskId;
  if (params.contactId !== undefined) body.contactId = params.contactId;
  if (params.filters !== undefined) body.filters = params.filters;

  return planfixPost(`datatag/${params.dataTagId}/entry/list`, body);
}

async function fetchAllDataTagEntries(params: z.infer<typeof getDataTagEntriesSchema>): Promise<unknown> {
  const pageSize = Math.min(params.pageSize ?? 100, 100);
  let offset = params.offset ?? 0;
  let pagesFetched = 0;
  let firstPage: EntriesResponse | undefined;
  const allEntries: DataTagEntry[] = [];

  while (true) {
    const page = await fetchDataTagEntries({ ...params, offset, pageSize }) as EntriesResponse;
    if (!firstPage) firstPage = page;

    const entries = extractEntries(page);
    allEntries.push(...entries);
    pagesFetched += 1;

    if (entries.length < pageSize || pageSize <= 0) break;
    offset += pageSize;
  }

  return {
    ...(firstPage ?? {}),
    dataTagEntries: allEntries,
    offset: params.offset ?? 0,
    pageSize,
    pagesFetched,
  };
}

function summarizeActualWorkTime(raw: unknown): TimeSummary {
  const entries = extractEntries(raw);
  const matchedFields: TimeSummary["matchedFields"] = [];

  for (const entry of entries) {
    for (const fieldValue of entry.customFieldData ?? []) {
      const minutes = extractMinutes(fieldValue);
      if (minutes === null) continue;

      matchedFields.push({
        entryKey: entry.key,
        fieldId: fieldValue.field?.id,
        fieldName: fieldValue.field?.name,
        minutes,
      });
    }
  }

  if (matchedFields.length === 0) {
    return {
      totalMinutes: null,
      totalHours: null,
      matchedFields,
      warning: "Не удалось надежно распознать поле с фактическим временем. Используйте raw или передайте fields с нужными ID полей.",
    };
  }

  const totalMinutes = matchedFields.reduce((sum, item) => sum + item.minutes, 0);
  return {
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    matchedFields,
  };
}

function extractEntries(raw: unknown): DataTagEntry[] {
  if (!raw || typeof raw !== "object") return [];
  const response = raw as EntriesResponse;
  if (Array.isArray(response.entries)) return response.entries;
  if (Array.isArray(response.dataTagEntries)) return response.dataTagEntries;
  if (Array.isArray(response.entryList)) return response.entryList;
  return [];
}

function extractMinutes(fieldValue: CustomFieldValue): number | null {
  const value = fieldValue.value;
  const fieldName = fieldValue.field?.name;

  if (typeof value === "number" && isTimeLikeField(fieldName)) return value;
  if (typeof value === "string") return parseTimeString(value, fieldName);
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (typeof record.minutes === "number") return record.minutes;
  if (typeof record.duration === "number" && isTimeLikeField(fieldName)) return record.duration;
  if (typeof record.time === "string") return parseTimeString(record.time, fieldName);
  if (typeof record.stringValue === "string") return parseTimeString(record.stringValue, fieldName);
  if (fieldValue.stringValue) {
    const minutes = parseTimeString(fieldValue.stringValue, fieldName);
    if (minutes !== null) return minutes;
  }
  if (isTimeLikeField(fieldName) && isTimePoint(record.from) && isTimePoint(record.to)) {
    return diffTimePoints(record.from.time, record.to.time);
  }

  return null;
}

function isTimeLikeField(fieldName?: string): boolean {
  if (!fieldName) return false;
  return /время|час|hours?|minutes?|duration|затрат|факт/i.test(fieldName);
}

function parseTimeString(value: string, fieldName?: string): number | null {
  if (!isTimeLikeField(fieldName)) return null;

  const range = value.match(/(\d{1,2}):([0-5]\d)\s*[-–]\s*(\d{1,2}):([0-5]\d)/);
  if (range) return diffTimePoints(`${range[1]}:${range[2]}`, `${range[3]}:${range[4]}`);

  const hourMinute = value.match(/^\s*(\d{1,3}):([0-5]\d)\s*$/);
  if (hourMinute) return Number(hourMinute[1]) * 60 + Number(hourMinute[2]);

  const hours = value.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hr|hour|hours|ч|час)/i);
  const minutes = value.match(/(\d+(?:[.,]\d+)?)\s*(?:m|min|minute|minutes|м|мин)/i);
  if (!hours && !minutes) return null;

  return Math.round(parseDecimal(hours?.[1]) * 60 + parseDecimal(minutes?.[1]));
}

function parseDecimal(value: string | undefined): number {
  if (!value) return 0;
  return Number(value.replace(",", "."));
}

function isTimePoint(value: unknown): value is { time: string } {
  return Boolean(value && typeof value === "object" && typeof (value as { time?: unknown }).time === "string");
}

function diffTimePoints(from: string, to: string): number | null {
  const fromMinutes = parseClockTime(from);
  const toMinutes = parseClockTime(to);
  if (fromMinutes === null || toMinutes === null) return null;

  const diff = toMinutes >= fromMinutes ? toMinutes - fromMinutes : toMinutes + 24 * 60 - fromMinutes;
  return diff;
}

function parseClockTime(value: string): number | null {
  const match = value.match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23) return null;
  return hours * 60 + minutes;
}
