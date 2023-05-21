<template>
  <div class="edit-page-thumbnail" :tabindex="index">
    <div
      :class="[
        'page-thumbnail',
        isVisible && 'visible',
        checkboxValue && 'selected',
      ]"
      @mouseenter="isHover = true"
      @mouseleave="isHover = false"
      @click="selectPage()"
    >
      <ServerImage
        :image-url="`${page.thumbnail_url}?${page.updated_at}`"
        :style="{
          transform: `rotate(${rotation}deg)`,
        }"
      >
        <b-skeleton width="57px" height="57px" />
      </ServerImage>

      <div v-if="isVisible" class="action-icon">
        <EyeIcon />
      </div>
    </div>
    <b-checkbox
      v-show="isHover || checkboxValue"
      v-model="checkboxValue"
      class="action-checkbox"
      @input="checkboxInput"
    />
    <span class="page-number">{{ page.number }}</span>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import ServerImage from "../../assets/images/ServerImage";
import EyeIcon from "../../assets/images/EyeIcon";

export default {
  name: "EditPageThumbnail",
  components: {
    ServerImage,
    EyeIcon,
  },
  props: {
    page: {
      required: true,
      type: Object,
      default: null,
    },
    index: {
      required: true,
      type: Number,
      default: 0,
    },
    rotation: {
      required: false,
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      isHover: false,
      checkboxValue: false,
    };
  },
  computed: {
    ...mapState("display", ["currentPage"]),
    ...mapState("edit", ["selectedPages"]),
    ...mapGetters("edit", ["isPageSelected"]),
    isVisible() {
      return this.currentPage === this.page.number;
    },
    isSelected() {
      return this.isPageSelected(this.page.id) !== undefined;
    },
  },
  watch: {
    isSelected() {
      this.checkboxValue = this.isSelected;
    },
  },
  mounted() {
    this.checkboxValue = this.isSelected;
  },
  methods: {
    selectPage(value = !this.isSelected) {
      this.changePage();
      this.$store.dispatch(
        value ? "edit/selectPage" : "edit/unselectPage",
        this.page
      );
    },
    checkboxInput(value) {
      this.selectPage(value);
    },
    changePage() {
      if (!this.isVisible) {
        this.$store.dispatch(
          "display/updateCurrentPage",
          parseInt(this.page.number, 10)
        );
      }
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../../assets/scss/edit_page_thumbnail.scss"
></style>
