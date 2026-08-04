"use client";

export function AiToggleForm({
  id,
  enabled,
  action,
}: {
  id: string;
  enabled: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
      <label className="toggle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            e.currentTarget.form?.requestSubmit();
          }}
        />
        <span className="track" />
      </label>
    </form>
  );
}
