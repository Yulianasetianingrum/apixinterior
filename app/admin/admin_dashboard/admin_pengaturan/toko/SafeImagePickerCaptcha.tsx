"use client";

import React from "react";
import ImagePickerCaptcha from "./ImagePickerCaptcha";

class Boundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: any) {
    // supaya tidak ngerusak seluruh halaman kalau komponen picker punya error DOM cleanup.
    console.error("ImagePickerCaptcha error:", err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Picker gambar bermasalah. Silakan refresh halaman.
        </div>
      );
    }
    return this.props.children as any;
  }
}

type Props = React.ComponentProps<typeof ImagePickerCaptcha>;

export default function SafeImagePickerCaptcha(props: Props) {
  return (
    <Boundary>
      <ImagePickerCaptcha {...props} />
    </Boundary>
  );
}
