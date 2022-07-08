<style
  scoped
  lang="scss"
  src="../../assets/scss/document_thumbnails.scss"
></style>
<template>
  <div :class="['document-pages', filter && 'filter']">
    <div
      :class="['document-thumbnail', currentPage == page.number && 'selected']"
      v-for="page in pages"
      v-bind:key="page.id"
      v-on:click="changePage(page.number)"
    >
      <div :class="['image-section', rotationModal && 'rotation-modal']">
        <div
          :class="['image-container']"
          :style="{
            transform: 'rotate(' + getRotation(page.id) + 'deg)'
          }"
        >
          <ServerImage
            :class="[
              'img-thumbnail',
              currentPage == page.number && 'selected',
              recalculatingAnnotations && 'blur'
            ]"
            :imageUrl="getThumbnailUrl(page)"
          />
          <div
            class="icon-container"
            @click="rotateSinglePage(page.id, page.number)"
          >
            <div
              class="icon"
              :style="{
                transform: 'rotate(' + getIconRotation(page.id) + 'deg)'
              }"
            >
              <RotateIcon />
            </div>
          </div>
        </div>
      </div>
      <div class="number-thumbnail">{{ page.number }}</div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ServerImage from "../../assets/images/ServerImage";
import RotateIcon from "../../assets/images/RotateIcon";
/**
 * This component creates a vertical list of the document pages
 * with thumbnail pictures of it which are also clickable.
 * It also creates a grid list of the pages in the toolbar modal
 * to allow the user to rotate them.
 */
export default {
  name: "DocumentThumbnails",
  props: {
    filter: {
      type: Boolean
    },
    rotationModal: {
      type: Boolean
    },
    rotations: {
      type: Array
    }
  },
  data() {
    return {
      thumbnailUrl: null
    };
  },
  components: {
    ServerImage,
    RotateIcon
  },
  computed: {
    ...mapState("document", ["pages", "recalculatingAnnotations"]),
    ...mapState("display", ["currentPage"])
  },
  methods: {
    /* Change page if not the currently open and not in modal */
    changePage(pageNumber) {
      if (pageNumber != this.currentPage && !this.filter) {
        this.$store.dispatch(
          "display/updateCurrentPage",
          parseInt(pageNumber, 10)
        );
      }
    },
    getThumbnailUrl(page) {
      this.thumbnailUrl = `${page.thumbnail_url}?${page.updated_at}`;

      return this.thumbnailUrl;
    },
    rotateSinglePage(id, number) {
      this.$emit("rotate-single-page", {
        pageId: id,
        pageNumber: number
      });
    },
    getRotation(pageId) {
      // rotate page
      return this.rotations?.find(rotation => rotation.id === pageId)?.angle;
    },
    getIconRotation(pageId) {
      // Keep rotation icon fixed when rotating page
      const pageRotation = this.getRotation(pageId);
      if (isNaN(pageRotation)) {
        return;
      }

      // Convert rotation into positive value
      const negativeToPositive = pageRotation * -1;

      // "rotate" the exact opposite to keep icon fixed
      return pageRotation - negativeToPositive * 2;
    }
  },
  watch: {
    pages(newValue, oldValue) {
      if (newValue === oldValue) {
        return;
      }

      this.pages.map(page => {
        this.getThumbnailUrl(page);
      });
    }
  },
  mounted() {
    this.pages.map(page => {
      this.getThumbnailUrl(page);
    });
  }
};
</script>
