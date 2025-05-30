<script lang="ts">
  type ImageModule = { default: string };
  const icelandImageModules: Record<string, ImageModule> = import.meta.glob(
    "$lib/photos/iceland/*.jpeg",
    {
      eager: true,
      query: {
        enhanced: true,
      },
    }
  );

  const utahImageModules: Record<string, ImageModule> = import.meta.glob(
    "$lib/photos/utah/*.jpeg",
    {
      eager: true,
      query: {
        enhanced: true,
      },
    }
  );
  const alaskaImageModules: Record<string, ImageModule> = import.meta.glob(
    "$lib/photos/alaska/*.jpeg",
    {
      eager: true,
      query: {
        enhanced: true,
      },
    }
  );
    const arizonaImageModules: Record<string, ImageModule> = import.meta.glob(
    "$lib/photos/arizona/*.jpeg",
    {
      eager: true,
      query: {
        enhanced: true,
      },
    }
  );
  const lakePowellImageModules: Record<string, ImageModule> = import.meta.glob(
    "$lib/photos/lake_powell/*.jpeg",
    {
      eager: true,
      query: {
        enhanced: true,
      },
    }
  );
  const colombiaImageModules: Record<string, ImageModule> = import.meta.glob(
    "$lib/photos/colombia/*.jpeg",
    {
      eager: true,
      query: {
        enhanced: true,
      },
    }
  );
  const spainImageModules: Record<string, ImageModule> = import.meta.glob(
    "$lib/photos/spain/*.jpeg",
    {
      eager: true,
      query: {
        enhanced: true,
      },
    }
  );
  const oregonImageModules: Record<string, ImageModule> = import.meta.glob(
    "$lib/photos/oregon/*.jpeg",
    {
      eager: true,
      query: {
        enhanced: true,
      },
    }
  );

  import Modal from "./Modal.svelte";
  let showModal = $state(false);
  let selectedImageModule = $state<ImageModule | undefined>();

  const albums = [
    {
      title: "Iceland 2025",
      imageModules: icelandImageModules,
    },
    {
      title: "Utah 2022",
      imageModules: utahImageModules,
    },
    {
      title: "Alaska 2019",
      imageModules: alaskaImageModules,
    },
    {
      title: "Arizona 2019",
      imageModules: arizonaImageModules,
    },
    {
      title: "Lake Powell 2018",
      imageModules: lakePowellImageModules,
    },
    {
      title: "Colombia 2018",
      imageModules: colombiaImageModules,
    },
    {
      title: "Spain 2018",
      imageModules: spainImageModules,
    },
    {
      title: "Oregon 2017-2019",
      imageModules: oregonImageModules,
    },
  ];
</script>

<div class="bg-white">
  {#each albums as album}
    <div class="p-2 font-serif text-2xl text-center text-gray-600">{album.title}</div>
    <div class="sm:grid w-full sm:grid-cols-5 flex flex-col">
      {#each Object.entries(album.imageModules) as [_path, module]}
        <!-- Small Screen -->
        <div class="sm:hidden flex">
          <button
            onclick={() => {
              selectedImageModule = module;
              showModal = true;
            }}
            aria-label="select"
            disabled={true}
          >
            <enhanced:img src={module.default} alt="Testing" />
          </button>
        </div>
        <!-- Large Screen -->
        <div class="hidden sm:flex">
          <button
            onclick={() => {
              selectedImageModule = module;
              showModal = true;
            }}
            aria-label="select"
            class="cursor-pointer"
          >
            <enhanced:img src={module.default} alt="Testing" />
          </button>
        </div>
      {/each}
    </div>
  {/each}
</div>

<!-- Modal -->
{#if showModal && selectedImageModule}
  <Modal bind:showModal>
    <enhanced:img
      src={selectedImageModule.default}
      class="select-none aspect-3/2 h-full w-full"
      alt="selected"
    />
  </Modal>
{/if}
