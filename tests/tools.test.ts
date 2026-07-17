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

  it("handleGetTasks calls task/list with defaults + fields", async () => {
    mockPost.mockResolvedValue({ tasks: [] });
    const { handleGetTasks } = await import("../src/tools/tasks.js");
    await handleGetTasks({});
    expect(mockPost).toHaveBeenCalledWith(
      "task/list",
      expect.objectContaining({ offset: 0, pageSize: 100, fields: expect.stringContaining("name") }),
    );
  });

  it("handleGetTasks coerces filterId to string", async () => {
    mockPost.mockResolvedValue({ tasks: [{ id: 1 }] });
    const { handleGetTasks } = await import("../src/tools/tasks.js");
    await handleGetTasks({ filterId: 42 });
    expect(mockPost).toHaveBeenCalledWith("task/list", expect.objectContaining({ filterId: "42" }));
  });

  it("handleGetTask calls GET task/:id with fields query", async () => {
    mockGet.mockResolvedValue({ task: { id: 5, name: "Test" } });
    const { handleGetTask } = await import("../src/tools/tasks.js");
    const result = await handleGetTask({ taskId: 5 });

    expect(mockGet).toHaveBeenCalledWith("task/5", expect.objectContaining({ fields: expect.any(String) }));
    expect(result).toContain("#5");

  });

  it("handleCreateTask sends PeopleRequest assignees shape", async () => {
    mockPost.mockResolvedValue({ result: "success", id: 10 });
    const { handleCreateTask } = await import("../src/tools/tasks.js");
    const result = await handleCreateTask({ name: "New task", projectId: 3, assigneeId: 7 });
    expect(mockPost).toHaveBeenCalledWith("task/", {
      name: "New task",
      project: { id: 3 },
      assignees: { users: [{ id: "user:7" }] },
    });
    expect(result).toContain("ID: 10");
  });

  it("handleUpdateTask sends status object and ack", async () => {
    mockPost.mockResolvedValue({});
    const { handleUpdateTask } = await import("../src/tools/tasks.js");
    const result = await handleUpdateTask({ taskId: 10, name: "Updated", status: 2 });
    expect(mockPost).toHaveBeenCalledWith("task/10", {
      name: "Updated",
      status: { id: 2 },
    });
    expect(result).toContain("#10");
  });

  it("handleUpdateTask fixes assignees shape", async () => {
    mockPost.mockResolvedValue({});
    const { handleUpdateTask } = await import("../src/tools/tasks.js");
    await handleUpdateTask({ taskId: 11, assigneeId: 99 });
    expect(mockPost).toHaveBeenCalledWith("task/11", {
      assignees: { users: [{ id: "user:99" }] },
    });
  });
});

describe("contacts tools", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("handleGetContacts calls contact/list with fields", async () => {
    mockPost.mockResolvedValue({ contacts: [] });
    const { handleGetContacts } = await import("../src/tools/contacts.js");
    await handleGetContacts({});
    expect(mockPost).toHaveBeenCalledWith(
      "contact/list",
      expect.objectContaining({ offset: 0, pageSize: 100, fields: expect.any(String) }),
    );
  });

  it("handleGetContact calls GET contact/:id with fields", async () => {
    mockGet.mockResolvedValue({ contact: { id: 3, name: "John" } });
    const { handleGetContact } = await import("../src/tools/contacts.js");
    const result = await handleGetContact({ contactId: 3 });
    expect(mockGet).toHaveBeenCalledWith("contact/3", expect.objectContaining({ fields: expect.any(String) }));
    expect(result).toContain("John");
  });

  it("handleCreateContact posts to contact/ with phones array", async () => {
    mockPost.mockResolvedValue({ result: "success", id: 50 });
    const { handleCreateContact } = await import("../src/tools/contacts.js");
    const result = await handleCreateContact({ name: "Acme", email: "a@b.c", phone: "+79991234567" });
    expect(mockPost).toHaveBeenCalledWith("contact/", {
      name: "Acme",
      email: "a@b.c",
      phones: [{ number: "+79991234567" }],
    });
    expect(result).toContain("ID: 50");
  });

  it("handleUpdateContact posts to contact/:id", async () => {
    mockPost.mockResolvedValue({});
    const { handleUpdateContact } = await import("../src/tools/contacts.js");
    const result = await handleUpdateContact({ contactId: 5, name: "Renamed" });
    expect(mockPost).toHaveBeenCalledWith("contact/5", { name: "Renamed" });
    expect(result).toContain("#5");
  });
});

describe("projects tools", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("handleGetProjects calls project/list with fields and no filterId", async () => {
    mockPost.mockResolvedValue({ projects: [] });
    const { handleGetProjects } = await import("../src/tools/projects.js");
    await handleGetProjects({});
    const body = mockPost.mock.calls[0][1] as Record<string, unknown>;
    expect(mockPost).toHaveBeenCalledWith("project/list", expect.objectContaining({ offset: 0, pageSize: 100, fields: expect.any(String) }));
    expect(body).not.toHaveProperty("filterId");
  });

  it("handleGetProject calls GET project/:id with fields", async () => {
    mockGet.mockResolvedValue({ project: { id: 1, name: "Proj" } });
    const { handleGetProject } = await import("../src/tools/projects.js");
    const result = await handleGetProject({ projectId: 1 });
    expect(mockGet).toHaveBeenCalledWith("project/1", expect.objectContaining({ fields: expect.any(String) }));
    expect(result).toContain("Proj");
  });
});

describe("comments tools (plural path regression)", () => {
  beforeEach(() => { vi.clearAllMocks(); });


  it("handleGetComments calls task/:id/comments/list (plural)", async () => {
    mockPost.mockResolvedValue({ comments: [] });
    const { handleGetComments } = await import("../src/tools/comments.js");
    await handleGetComments({ taskId: 5 });
    expect(mockPost).toHaveBeenCalledWith(
      "task/5/comments/list",
      expect.objectContaining({ offset: 0, pageSize: 100 }),
    );
  });

  it("handleAddComment posts to task/:id/comments/ (plural) with description", async () => {
    mockPost.mockResolvedValue({ result: "success", id: 99 });

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

  it("handleGetTaskActualWorkTime fetches all pages", async () => {
    mockPost
      .mockResolvedValueOnce({
        dataTagEntries: [
          {
            key: 1,
            customFieldData: [
              {
                field: { id: 106948, name: "Время работы:", type: 6 },
                value: { from: { time: "10:00" }, to: { time: "11:00" } },
              },
            ],
          },
          {
            key: 2,
            customFieldData: [
              {
                field: { id: 106948, name: "Время работы:", type: 6 },
                value: { from: { time: "12:00" }, to: { time: "13:30" } },
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        dataTagEntries: [
          {
            key: 3,
            customFieldData: [
              {
                field: { id: 106948, name: "Время работы:", type: 6 },
                value: { from: { time: "15:00" }, to: { time: "15:45" } },
              },
            ],
          },
        ],
      });

    const { handleGetTaskActualWorkTime } = await import("../src/tools/datatags.js");
    const result = JSON.parse(await handleGetTaskActualWorkTime({ taskId: 20795, pageSize: 2 }));

    expect(mockPost).toHaveBeenNthCalledWith(1, "datatag/28008/entry/list", {
      offset: 0,
      pageSize: 2,
      fields: "dataTag,key,commentId,task,contact,106950,106948,106944,106946,109380,109386",
      taskId: 20795,
    });
    expect(mockPost).toHaveBeenNthCalledWith(2, "datatag/28008/entry/list", {
      offset: 2,
      pageSize: 2,
      fields: "dataTag,key,commentId,task,contact,106950,106948,106944,106946,109380,109386",
      taskId: 20795,
    });
    expect(result.summary.totalMinutes).toBe(195);
    expect(result.raw.dataTagEntries).toHaveLength(3);
    expect(result.raw.pagesFetched).toBe(2);
  });
});

describe("users tools", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("handleListUsers calls user/list with fields", async () => {
    mockPost.mockResolvedValue({ users: [] });
    const { handleListUsers } = await import("../src/tools/users.js");
    await handleListUsers({});
    expect(mockPost).toHaveBeenCalledWith(
      "user/list",
      expect.objectContaining({ offset: 0, pageSize: 100, fields: expect.any(String) }),
    );
  });

  it("handleGetUser calls GET user/:id with fields", async () => {
    mockGet.mockResolvedValue({ user: { id: 7, name: "Ivan" } });
    const { handleGetUser } = await import("../src/tools/users.js");
    const result = await handleGetUser({ userId: 7 });
    expect(mockGet).toHaveBeenCalledWith("user/7", expect.objectContaining({ fields: expect.any(String) }));
    expect(result).toContain("Ivan");
  });
});

describe("directories tools", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("handleListDirectories calls directory/list", async () => {
    mockPost.mockResolvedValue({ directories: [] });
    const { handleListDirectories } = await import("../src/tools/directories.js");
    await handleListDirectories({});
    expect(mockPost).toHaveBeenCalledWith("directory/list", expect.objectContaining({ offset: 0, pageSize: 100 }));
  });

  it("handleListDirectoryEntries calls directory/:id/entry/list", async () => {
    mockPost.mockResolvedValue({ directoryEntries: [] });
    const { handleListDirectoryEntries } = await import("../src/tools/directories.js");
    await handleListDirectoryEntries({ directoryId: 3 });
    expect(mockPost).toHaveBeenCalledWith("directory/3/entry/list", expect.objectContaining({ offset: 0, pageSize: 100 }));
  });
});

describe("custom fields tool", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("handleListCustomFields calls GET customfield/:objectType", async () => {
    mockGet.mockResolvedValue({ customFields: [] });
    const { handleListCustomFields } = await import("../src/tools/customfields.js");
    await handleListCustomFields({ objectType: "task" });
    expect(mockGet).toHaveBeenCalledWith("customfield/task");
  });
});

describe("datatags tool", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("handleListDatatags calls datatag/list", async () => {
    mockPost.mockResolvedValue({ dataTags: [] });
    const { handleListDatatags } = await import("../src/tools/datatags.js");
    await handleListDatatags({});
    expect(mockPost).toHaveBeenCalledWith("datatag/list", expect.objectContaining({ offset: 0, pageSize: 100 }));
  });
});

describe("files tools", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("handleUploadFileFromUrl posts to file/from-url/ with url+name", async () => {
    mockPost.mockResolvedValue({ result: "success", id: 321 });
    const { handleUploadFileFromUrl } = await import("../src/tools/files.js");
    const result = await handleUploadFileFromUrl({ url: "https://x/y.pdf", name: "y.pdf" });
    expect(mockPost).toHaveBeenCalledWith("file/from-url/", { url: "https://x/y.pdf", name: "y.pdf" });
    expect(result).toContain("ID: 321");
  });

  it("handleGetFile calls GET file/:id", async () => {
    mockGet.mockResolvedValue({ file: { id: 9, name: "doc.pdf" } });
    const { handleGetFile } = await import("../src/tools/files.js");
    const result = await handleGetFile({ fileId: 9 });
    expect(mockGet).toHaveBeenCalledWith("file/9");
    expect(result).toContain("doc.pdf");

  });
});
