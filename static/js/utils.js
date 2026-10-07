function toSlug(name) {
    return name
        .toLowerCase()
        .replace('♀', '-f')
        .replace('♂', '-m')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}