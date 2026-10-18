"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Download, ImagePlus, LoaderCircle, LogOut, ShieldCheck, Upload } from "lucide-react";
import { browserSupabase } from "../lib/supabase/browser";

type Preset = "hero" | "grid" | "compact";
type Corner = "left" | "right";
type OutputFormat = "image/jpeg" | "image/png";

const presets: Record<Preset, { label: string; width: number; height: number; detail: string }> = {
  hero: { label: "Hero banner", width: 1600, height: 900, detail: "16:9" },
  grid: { label: "Grid thumbnail", width: 1200, height: 900, detail: "4:3" },
  compact: { label: "Compact feed", width: 1000, height: 1000, detail: "1:1" }
};

export default function ImageStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionUser, setSessionUser] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [preset, setPreset] = useState<Preset>("hero");
  const [corner, setCorner] = useState<Corner>("right");
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");

  useEffect(() => {
    if (!browserSupabase) { setSessionReady(true); return; }
    browserSupabase.auth.getSession().then(({ data }) => {
      setSessionUser(Boolean(data.session));
      setSessionReady(true);
    });
    const { data: { subscription } } = browserSupabase.auth.onAuthStateChange((_event, session) => setSessionUser(Boolean(session)));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceUrl) return;
    const dimensions = presets[preset];
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d");
    if (!context) return;
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      const cropWidth = canvas.width / scale;
      const cropHeight = canvas.height / scale;
      const cropX = (image.naturalWidth - cropWidth) / 2;
      const cropY = (image.naturalHeight - cropHeight) / 2;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
      drawWatermark(context, canvas.width, canvas.height, corner);
    };
    image.onerror = () => setMessage("The selected image could not be decoded.");
    image.src = sourceUrl;
    return () => { active = false; };
  }, [sourceUrl, preset, corner]);

  function acceptFile(nextFile: File | undefined) {
    if (!nextFile) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(nextFile.type)) { setMessage("Choose a PNG, JPEG, WebP, or GIF image."); return; }
    if (nextFile.size > 15 * 1024 * 1024) { setMessage("Images must be 15 MB or smaller."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFile(nextFile);
        setSourceUrl(reader.result);
        setUploadedUrl("");
        setMessage("");
      }
    };
    reader.onerror = () => setMessage("The selected image could not be read.");
    reader.readAsDataURL(nextFile);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  }

  async function signIn(event: ChangeEvent<HTMLFormElement> | React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!browserSupabase) { setMessage("Supabase public configuration is missing."); return; }
    const { error } = await browserSupabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Signed in.");
  }

  function exportBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) { reject(new Error("Prepare an image before exporting.")); return; }
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The browser could not encode this image.")), format, 0.92);
    });
  }

  async function downloadImage() {
    setMessage("");
    try {
      const blob = await exportBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${file?.name.replace(/\.[^.]+$/, "") || "twns-image"}-${preset}.${format === "image/png" ? "png" : "jpg"}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image export failed.");
    }
  }

  async function uploadImage() {
    if (!browserSupabase || !sessionUser) { setMessage("Sign in with an authorized editorial account to upload."); return; }
    setBusy(true);
    setMessage("");
    try {
      const blob = await exportBlob();
      const extension = format === "image/png" ? "png" : "jpg";
      const path = `editorial/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
      const { error } = await browserSupabase.storage.from("article-media").upload(path, blob, { contentType: format, cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = browserSupabase.storage.from("article-media").getPublicUrl(path);
      setUploadedUrl(data.publicUrl);
      setMessage("Branded image uploaded to article-media.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed. Check the article-media bucket and its access policies.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await browserSupabase?.auth.signOut();
    setMessage("Signed out.");
  }

  return <section className="image-studio-shell">
    <div className="image-studio-toolbar">
      <div><p className="section-kicker">PUBLISHING TOOLS</p><h2>Image Studio</h2><p>Crop, brand, and prepare editorial media for publication.</p></div>
      {sessionReady && <div className="image-studio-session">{sessionUser ? <><span><ShieldCheck size={15} /> Editorial session active</span><button type="button" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={16} /></button></> : <span><ShieldCheck size={15} /> Sign in to upload</span>}</div>}
    </div>

    {!sessionReady ? <p className="studio-feedback">Checking editorial session...</p> : !sessionUser ? <form className="studio-login" onSubmit={signIn}>
      <strong>Editorial sign-in</strong><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      <button className="button button-dark" type="submit">Sign in to upload</button>
    </form> : null}

    <div className="image-studio-workspace">
      <div className="image-studio-controls">
        <label className={`studio-dropzone ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFileChange} />
          <ImagePlus size={25} /><strong>{file ? "Replace image" : "Drop an image here"}</strong><span>{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : "or browse your device · up to 15 MB"}</span>
        </label>

        <fieldset className="studio-fieldset"><legend>Canvas preset</legend>{(Object.entries(presets) as [Preset, typeof presets[Preset]][]).map(([key, value]) => <label className={`studio-preset ${preset === key ? "is-selected" : ""}`} key={key}>
          <input type="radio" name="image-preset" value={key} checked={preset === key} onChange={() => setPreset(key)} /><span><strong>{value.label}</strong><small>{value.detail} · {value.width} × {value.height}</small></span>
        </label>)}</fieldset>

        <label className="studio-select-label">Watermark corner<select value={corner} onChange={(event) => setCorner(event.target.value as Corner)}><option value="right">Bottom right</option><option value="left">Bottom left</option></select></label>
        <label className="studio-select-label">Export format<select value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)}><option value="image/jpeg">JPEG · high quality</option><option value="image/png">PNG · lossless</option></select></label>

        <div className="studio-actions"><button type="button" className="button button-dark" onClick={downloadImage} disabled={!file}><Download size={16} /> Download preview</button><button type="button" className="button button-outline-dark" onClick={uploadImage} disabled={!file || !sessionUser || busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Upload size={16} />} Upload to bucket</button></div>
        {message && <p className="studio-feedback" role="status">{message}</p>}
        {uploadedUrl && <a className="studio-uploaded-link" href={uploadedUrl} target="_blank" rel="noreferrer">Open uploaded image</a>}
      </div>

      <div className="studio-preview-column"><div className="studio-preview-heading"><span>BRANDED PREVIEW</span><span>{presets[preset].width} × {presets[preset].height}</span></div><div className={`studio-canvas-frame studio-canvas-${preset}`}>
        {file ? <canvas ref={canvasRef} aria-label={`TWNS branded ${presets[preset].label} preview`} /> : <div className="studio-empty-preview"><ImagePlus size={28} /><span>Your crop and watermark preview</span></div>}
      </div></div>
    </div>
  </section>;
}

function drawWatermark(context: CanvasRenderingContext2D, width: number, height: number, corner: Corner) {
  const scale = Math.max(width / 1600, 0.625);
  const padding = Math.round(19 * scale);
  const markSize = Math.round(42 * scale);
  const gap = Math.round(10 * scale);
  const panelWidth = markSize + gap + Math.round(104 * scale);
  const panelHeight = markSize + padding * 1.5;
  const x = corner === "left" ? padding : width - panelWidth - padding;
  const y = height - panelHeight - padding;
  context.save();
  context.globalAlpha = 0.88;
  context.fillStyle = "#090d16";
  context.fillRect(x, y, panelWidth, panelHeight);
  context.fillStyle = "#dc2626";
  context.fillRect(x + padding / 2, y + padding / 2, markSize, markSize);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `700 ${Math.round(15 * scale)}px Arial, sans-serif`;
  context.fillText("TW", x + padding / 2 + markSize / 2, y + padding / 2 + markSize / 2);
  context.textAlign = "left";
  context.font = `700 ${Math.round(17 * scale)}px Arial, sans-serif`;
  context.fillText("TWNS", x + padding + markSize, y + panelHeight / 2 - Math.round(5 * scale));
  context.globalAlpha = 0.72;
  context.font = `${Math.round(8 * scale)}px Arial, sans-serif`;
  context.fillText("THE WORLD NEWS STATION", x + padding + markSize, y + panelHeight / 2 + Math.round(9 * scale));
  context.restore();
}
