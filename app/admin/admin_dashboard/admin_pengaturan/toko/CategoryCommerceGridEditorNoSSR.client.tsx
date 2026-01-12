"use client";

import * as React from "react";
import CategoryCommerceGridEditor from "./CategoryCommerceGridEditor.client";

export default function CategoryCommerceGridEditorNoSSR(
  props: React.ComponentProps<typeof CategoryCommerceGridEditor>,
) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <CategoryCommerceGridEditor {...props} />;
}
