export declare function createPlace(title: string, content: string, address: string, lat: number, lng: number, photoKey?: string): Promise<import("proto/pages_pb").Page.AsObject>;
export declare function createGuide(title: string, content: string, parentCommunityId: number, address: string, lat?: number, lng?: number): Promise<import("proto/pages_pb").Page.AsObject>;
export declare function getPage(pageId: number): Promise<import("proto/pages_pb").Page.AsObject>;
interface UpdatePageInput {
    content?: string;
    pageId: number;
    title?: string;
}
export declare function updatePage({ content, pageId, title }: UpdatePageInput): Promise<import("proto/pages_pb").Page.AsObject>;
export {};
//# sourceMappingURL=pages.d.ts.map