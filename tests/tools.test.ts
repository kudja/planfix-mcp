import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/client.js", () => ({
  planfixPost: vi.fn(),
  planfixGet: vi.fn(),
}));

import { planfixPost, planfixGet } from "../src/client.js";

const mockPost = vi.mocked(planfixPost);
const mockGet = vi.mocked(planfixGet);

describe("tasks tools", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("handleGetTasks calls task/list with defaults", async () => {
    mockPost.mockResolvedValue({ tasks: [] });
    const { handleGetTasks } = await import("../src/tools/tasks.js");
    const result = await handleGetTasks({});
    expect(mockPost).toHaveBeenCalledWith("task/list", { offset: 0, pageSize: 100 });
    expect(JSON.parse(result)).toEqual({ tasks: [] });
  });

  it("handleGetTasks passes filterId", async () => {
    mockPost.mockResolvedValue({ tasks: [{ id: 1 }] });
    const { handleGetTasks } = await import("../src/tools/tasks.js");
    await handleGetTasks({ filterId: 42 });
    expect(mockPost).toHaveBeenCalledWith("task/list", { offset: 0, pageSize: 100, filterId: 42 });
  });

  it("handleGetTask calls GET task/:id", async () => {
    mockGet.mockResolvedValue({ id: 5, name: "Test" });
    const { handleGetTask } = await import("../src/tools/tasks.js");
    const result = await handleGetTask({ taskId: 5 });
    expect(mockGet).toHaveBeenCalledWith(
      "task/5?fields=name%2Cdescription%2Cstatus%2Cproject%2Cassigner%2Cassignees%2Cparticipants%2CdateTime%2CcustomData",
    );
    expect(JSON.parse(result).id).toBe(5);
  });

  it("handleCreateTask sends correct body", async () => {
    mockPost.mockResolvedValue({ id: 10 });
    const { handleCreateTask } = await import("../src/tools/tasks.js");
    await handleCreateTask({ name: "New task", projectId: 3, assigneeId: 7 });
    expect(mockPost).toHaveBeenCalledWith("task/", {
      name: "New task",
      project: { id: 3 },
      assignees: [{ id: 7 }],
    });
  });

  it("handleUpdateTask sends correct body", async () => {
    mockPost.mockResolvedValue({ id: 10 });
    const { handleUpdateTask } = await import("../src/tools/tasks.js");
    await handleUpdateTask({ taskId: 10, name: "Updated", status: 2 });
    expect(mockPost).toHaveBeenCalledWith("task/10", {
      name: "Updated",
      status: { id: 2 },
    });
  });
});

describe("contacts tools", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("handleGetContacts calls contact/list", async () => {
    mockPost.mockResolvedValue({ contacts: [] });
    const { handleGetContacts } = await import("../src/tools/contacts.js");
    await handleGetContacts({});
    expect(mockPost).toHaveBeenCalledWith("contact/list", { offset: 0, pageSize: 100 });
  });

  it("handleGetContact calls GET contact/:id", async () => {
    mockGet.mockResolvedValue({ id: 3, name: "John" });
    const { handleGetContact } = await import("../src/tools/contacts.js");
    const result = await handleGetContact({ contactId: 3 });
    expect(mockGet).toHaveBeenCalledWith("contact/3");
    expect(JSON.parse(result).name).toBe("John");
  });
});

describe("projects tools", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("handleGetProjects calls project/list", async () => {
    mockPost.mockResolvedValue({ projects: [] });
    const { handleGetProjects } = await import("../src/tools/projects.js");
    await handleGetProjects({});
    expect(mockPost).toHaveBeenCalledWith("project/list", { offset: 0, pageSize: 100 });
  });

  it("handleGetProject calls GET project/:id", async () => {
    mockGet.mockResolvedValue({ id: 1, name: "Proj" });
    const { handleGetProject } = await import("../src/tools/projects.js");
    const result = await handleGetProject({ projectId: 1 });
    expect(mockGet).toHaveBeenCalledWith("project/1");
    expect(JSON.parse(result).name).toBe("Proj");
  });
});

describe("comments tools", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("handleGetComments calls task/:id/comments/list", async () => {
    mockPost.mockResolvedValue({ comments: [] });
    const { handleGetComments } = await import("../src/tools/comments.js");
    await handleGetComments({ taskId: 5 });
    expect(mockPost).toHaveBeenCalledWith("task/5/comments/list", {
      offset: 0,
      pageSize: 100,
      fields: "description,dateTime,owner,recipients,type,files",
    });
  });

  it("handleAddComment posts to task/:id/comments/", async () => {
    mockPost.mockResolvedValue({ id: 99 });
    const { handleAddComment } = await import("../src/tools/comments.js");
    await handleAddComment({ taskId: 5, body: "Hello" });
    expect(mockPost).toHaveBeenCalledWith("task/5/comments/", { description: "Hello" });
  });
});

describe("datatags tools", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("handleGetDataTags calls datatag/list with defaults", async () => {
    mockPost.mockResolvedValue({ dataTags: [] });
    const { handleGetDataTags } = await import("../src/tools/datatags.js");
    await handleGetDataTags({});
    expect(mockPost).toHaveBeenCalledWith("datatag/list", {
      offset: 0,
      pageSize: 100,
      fields: "id,name,group,fields",
    });
  });

  it("handleGetDataTag calls GET datatag/:id", async () => {
    mockGet.mockResolvedValue({ dataTag: { id: 28008 } });
    const { handleGetDataTag } = await import("../src/tools/datatags.js");
    await handleGetDataTag({ dataTagId: 28008 });
    expect(mockGet).toHaveBeenCalledWith("datatag/28008?fields=id%2Cname%2Cgroup%2Cfields");
  });

  it("handleGetDataTagFields calls customfield/datatag/:id", async () => {
    mockGet.mockResolvedValue({ fields: [] });
    const { handleGetDataTagFields } = await import("../src/tools/datatags.js");
    await handleGetDataTagFields({ dataTagId: 28008, fields: "id,name,type" });
    expect(mockGet).toHaveBeenCalledWith("customfield/datatag/28008?fields=id%2Cname%2Ctype");
  });

  it("handleGetDataTagEntry calls GET datatag/entry/:key", async () => {
    mockGet.mockResolvedValue({ entry: { key: 52452 } });
    const { handleGetDataTagEntry } = await import("../src/tools/datatags.js");
    await handleGetDataTagEntry({ key: 52452, fields: "key,dataTag,10" });
    expect(mockGet).toHaveBeenCalledWith("datatag/entry/52452?fields=key%2CdataTag%2C10");
  });

  it("handleGetDataTagEntries posts taskId and filters", async () => {
    mockPost.mockResolvedValue({ entries: [] });
    const { handleGetDataTagEntries } = await import("../src/tools/datatags.js");
    await handleGetDataTagEntries({
      dataTagId: 28008,
      taskId: 20795,
      fields: "dataTag,key,10",
      filters: [{ type: 3103, field: 10, operator: "equal", value: "user:1" }],
    });
    expect(mockPost).toHaveBeenCalledWith("datatag/28008/entry/list", {
      offset: 0,
      pageSize: 100,
      fields: "dataTag,key,10",
      taskId: 20795,
      filters: [{ type: 3103, field: 10, operator: "equal", value: "user:1" }],
    });
  });

  it("handleGetTaskActualWorkTime returns raw entries and summary", async () => {
    mockPost.mockResolvedValue({
      entries: [
        {
          key: 1,
          customFieldData: [
            { field: { id: 10, name: "Фактическое время" }, value: "1:30" },
            { field: { id: 11, name: "Описание" }, value: "Layout" },
          ],
        },
        {
          key: 2,
          customFieldData: [
            { field: { id: 10, name: "Фактическое время" }, value: { minutes: 45 } },
          ],
        },
      ],
    });
    const { handleGetTaskActualWorkTime } = await import("../src/tools/datatags.js");
    const result = JSON.parse(await handleGetTaskActualWorkTime({ taskId: 20795 }));
    expect(mockPost).toHaveBeenCalledWith("datatag/28008/entry/list", {
      offset: 0,
      pageSize: 100,
      fields: "dataTag,key,commentId,task,contact,106950,106948,106944,106946,109380,109386",
      taskId: 20795,
    });
    expect(result.summary.totalMinutes).toBe(135);
    expect(result.summary.totalHours).toBe(2.25);
    expect(result.raw.entries).toHaveLength(2);
  });

  it("handleGetTaskActualWorkTime sums period-of-time fields", async () => {
    mockPost.mockResolvedValue({
      dataTagEntries: [
        {
          key: 52448,
          customFieldData: [
            {
              field: { id: 106948, name: "Время работы:", type: 6 },
              value: { from: { time: "13:20" }, to: { time: "17:00" } },
              stringValue: "13:20 - 17:00",
            },
          ],
        },
      ],
    });
    const { handleGetTaskActualWorkTime } = await import("../src/tools/datatags.js");
    const result = JSON.parse(await handleGetTaskActualWorkTime({ taskId: 20795 }));
    expect(result.summary.totalMinutes).toBe(220);
    expect(result.summary.totalHours).toBe(3.67);
  });

  it("handleGetTaskActualWorkTime warns when time fields are not recognized", async () => {
    mockPost.mockResolvedValue({
      entries: [{ key: 1, customFieldData: [{ field: { id: 10, name: "Описание" }, value: "text" }] }],
    });
    const { handleGetTaskActualWorkTime } = await import("../src/tools/datatags.js");
    const result = JSON.parse(await handleGetTaskActualWorkTime({ taskId: 20795 }));
    expect(result.summary.totalMinutes).toBeNull();
    expect(result.summary.warning).toContain("Не удалось");
  });
});
