import api from "@flatfile/api";
import { FlatfileEvent, FlatfileListener } from "@flatfile/listener";

export default function flatfileEventListener(listener: FlatfileListener) {
  listener.on("upload:completed", async (event: FlatfileEvent) => {
    const {
      context: { spaceId, environmentId },
    } = event;
    try {
      const updateSpace = await api.spaces.update(spaceId, {
        environmentId,
        metadata: {
          sidebarConfig: {
            showSidebar: false,
          },
        },
      });
      console.log(updateSpace.data.metadata?.sidebarConfig);
      // Additional code related to the space update process
    } catch (error) {
      console.error("Error:", error.stack);
      // Handle the error appropriately
    }
  });
}
