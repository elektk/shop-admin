import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Spinner from "@/components/Spinner";
import { ReactSortable } from "react-sortablejs";
import { useAccess } from "./AccessContext";

export default function ProductForm({
  _id,
  title: existingTitle,
  description: existingDescription,
  price: existingPrice,
  images: existingImages,
  category: assignedCategory,
  properties: assignedProperties,
}) {
  const [title, setTitle] = useState(existingTitle || '');
  const [description, setDescription] = useState(existingDescription || '');
  const [category, setCategory] = useState(assignedCategory || '');
  const [productProperties, setProductProperties] = useState(assignedProperties || {});
  const [price, setPrice] = useState(existingPrice || '');
  const [images, setImages] = useState(existingImages || []);
  const [goToProducts, setGoToProducts] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const router = useRouter();
  const { isTestAdmin } = useAccess();

  useEffect(() => {
    setCategoriesLoading(true);
    axios.get('/api/categories').then(result => {
      setCategories(result.data);
      setCategoriesLoading(false);
    });
  }, []);

  async function saveProduct(ev) {
    ev.preventDefault();
    const data = {
      title, description, price, images, category,
      properties: productProperties
    };
    if (_id) {
      await axios.put('/api/products', { ...data, _id });
    } else {
      await axios.post('/api/products', data);
    }
    setGoToProducts(true);
  }

  if (goToProducts) {
    router.push('/products');
  }

  async function uploadImages(ev) {
    const files = ev.target?.files;
    if (files?.length > 0) {
      setIsUploading(true);
      const data = new FormData();
      for (const file of files) {
        data.append('file', file);
      }
      const res = await axios.post('/api/upload', data);
      setImages(oldImages => [...oldImages, ...res.data.links]);
      setIsUploading(false);
    }
  }

  async function deleteImage(link) {
    try {
      if (!_id) {
        setImages(oldImages => oldImages.filter(img => img !== link));
        return;
      }
      await axios.delete(`/api/products?id=${_id}&image=${encodeURIComponent(link)}`);
      setImages(oldImages => oldImages.filter(img => img !== link));
    } catch (error) {
      console.error("Ошибка при удалении изображения:", error);
      alert("Не удалось удалить изображение. Проверьте консоль для деталей.");
    }
  }

  function updateImagesOrder(images) {
    setImages(images);
  }

  function setProductProp(propName, value) {
    setProductProperties(prev => {
      const newProductProps = { ...prev };
      newProductProps[propName] = value;
      return newProductProps;
    });
  }

  const propertiesToFill = [];
  if (categories.length > 0 && category) {
    let catInfo = categories.find(({ _id }) => _id === category);
    if (catInfo?.properties) {
      propertiesToFill.push(...catInfo.properties);
    }
    while (catInfo?.parent?._id) {
      const parentCat = categories.find(({ _id }) => _id === catInfo.parent._id);
      if (!parentCat) break;
      if (parentCat.properties) {
        propertiesToFill.push(...parentCat.properties);
      }
      catInfo = parentCat;
    }
  }

  return (
    <form onSubmit={saveProduct}>
      <label>Название продукта</label>
      <input
        type="text"
        placeholder="название продукта"
        value={title}
        disabled={isTestAdmin}
        onChange={ev => setTitle(ev.target.value)}
      />
      <label>Категория</label>
      <select disabled={isTestAdmin} value={category} onChange={ev => setCategory(ev.target.value)}>
        <option value="">Без категории</option>
        {categories.length > 0 && categories.map(c => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>
      {categoriesLoading && <Spinner />}
      {propertiesToFill.length > 0 && propertiesToFill.map(p => (
        <div key={p.name} className="">
          <label>{p.name[0].toUpperCase() + p.name.substring(1)}</label>
          <div>
            <select
              value={productProperties[p.name]}
              onChange={ev => setProductProp(p.name, ev.target.value)}
            >
              {p.values.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
      <label>Фотографии</label>
      <div className="mb-2 flex flex-wrap gap-1">
        <ReactSortable
          list={images}
          className="flex flex-wrap gap-1"
          setList={updateImagesOrder}
        >
          {!!images?.length && images.map(link => (
            <div key={link} className="h-24 bg-white p-4 shadow-sm rounded-sm border border-gray-200 relative">
              <img src={link} alt="" className="rounded-lg" />
              <button
                type="button"
                disabled={isTestAdmin}
                onClick={() => deleteImage(link)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </ReactSortable>
        {isUploading && (
          <div className="h-24 flex items-center">
            <Spinner />
          </div>
        )}
        <label className="w-24 h-24 cursor-pointer text-center flex flex-col items-center justify-center text-sm gap-1 text-primary rounded-sm bg-white shadow-sm border border-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <div>Добавить фото</div>
          <input disabled={isTestAdmin} type="file" onChange={uploadImages} className="hidden" />
        </label>
      </div>
      <label>Описание</label>
      <textarea
        placeholder="описание"
        value={description}
        disabled={isTestAdmin}
        onChange={ev => setDescription(ev.target.value)}
      />
      <label>Цена (в рублях)</label>
      <input
        type="number"
        placeholder="цена"
        value={price}
        disabled={isTestAdmin}
        onChange={ev => setPrice(ev.target.value)}
      />
      <button disabled={isTestAdmin} type="submit" className="btn-primary">
        Сохранить
      </button>
    </form>
  );
}