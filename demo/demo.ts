"use strict";

import documentsDemo from "./demos/documents-demo";
import dynamicDemo from "./demos/dynamic-demo";
import extractorDemo from "./demos/extractor-demo";
import simpleDemo from "./demos/simple-demo";
import themingDemo from "./demos/theming-demo";

import { Client } from "@flatfile/listener";

export default function (listener: Client) {
  listener.namespace(["space:simple-demo"], simpleDemo);
  listener.namespace(["space:theming-demo"], themingDemo);
  listener.namespace(["space:extractor-demo"], extractorDemo);
  listener.namespace(["space:dynamic-demo"], dynamicDemo);
  listener.namespace(["space:documents-demo"], documentsDemo);
}
