import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAllItems } from "../src/api/inventaireApi.jsx";

describe("inventaireApi.getAllItems", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("retourne le json si res.ok=true", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [1, 2, 3] }),
    }));

    const res = await getAllItems();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ data: [1, 2, 3] });
  });

  it("throw Error si res.ok=false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "nope" }),
    }));

    await expect(getAllItems()).rejects.toThrow(/erreur api inventaire/i);
  });
});
