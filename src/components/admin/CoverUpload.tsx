import { saveCoverAction } from "@/app/admin/portal-actions";
import { CourseCover } from "@/components/CourseCover";
import { coverUrl } from "@/lib/portal/covers";

/** Admin: the course's title picture with upload / remove controls. */
export function CoverUpload({ slug, color }: { slug: string; color: string }) {
  const image = coverUrl(slug);
  return (
    <div className="cover-admin">
      <CourseCover slug={slug} color={color} image={image} label="" className="cover-admin__thumb" idSuffix="-admin" />
      <form action={saveCoverAction} className="cover-admin__form">
        <input type="hidden" name="slug" value={slug} />
        <label className="admin-field">
          <span className="admin-field__label">Title picture (JPG, PNG or WebP, landscape, up to 5 MB)</span>
          <input type="file" name="cover" accept="image/jpeg,image/png,image/webp" required />
        </label>
        <button className="btn btn--ghost btn--sm">
          <span className="btn__label">{image ? "Replace picture" : "Upload picture"}</span>
        </button>
      </form>
      {image && image.startsWith(`/covers/${slug}?`) && (
        <form action={saveCoverAction}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="remove" value="1" />
          <button className="btn btn--ghost btn--sm btn--danger">
            <span className="btn__label">Remove picture</span>
          </button>
        </form>
      )}
    </div>
  );
}
