// src/components/TermsDashboard.tsx
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";

// Definimos un tipo para el estado del formulario
const initialFormState = {
  name: "",
  key: "",
  startDate: "",
  endDate: "",
  classCatalogId: "YOUR_CLASS_CATALOG_ID_HERE", // ⚠️ ¡Importante! Reemplaza con un ID real o un selector
}; 

export default function TermsDashboard() {
    
  // Estado para el formulario (datos del periodo)
  const [formData, setFormData] = useState(initialFormState);
  // Estado para manejar la edición
  const [editingTerm, setEditingTerm] = useState(null);

  // Convex: Hooks de mutación y consulta
  const allTerms = useQuery(api.functions.terms.getTermsBySchoolCycle, {schoolCycleId}) || [];
  const createTerm = useMutation(api.functions.terms.createTerm);
  const updateTerm = useMutation(api.functions.terms.updateTerm);
  const deleteTerm = useMutation(api.functions.terms.deleteTerm);

  // Manejadores de eventos
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (term: ) => {
    setEditingTerm(term);
    setFormData({
      name: term.name,
      key: term.key,
      startDate: new Date(term.startDate).toISOString().substring(0, 10),
      endDate: new Date(term.endDate).toISOString().substring(0, 10),
      status: term.status,
      classCatalogId: term.classCatalogId,
    });
  };

  const handleClearForm = () => {
    setEditingTerm(null);
    setFormData(initialFormState);
  };

  const handleDelete = async (termId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este periodo?")) {
      await deleteTerm({ termId });
      alert("Periodo eliminado con éxito.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      startDate: new Date(formData.startDate).getTime(),
      endDate: new Date(formData.endDate).getTime(),
    };
    
    try {
      if (editingTerm) {
        // Actualizar periodo existente
        await updateTerm({
          termId: editingTerm._id,
          data: dataToSend,
        });
        alert("Periodo actualizado con éxito.");
      } else {
        // Crear nuevo periodo
        await createTerm(dataToSend);
        alert("Periodo creado con éxito.");
      }
      handleClearForm(); // Limpiar el formulario después de la operación
    } catch (error) {
      console.error("Error al guardar el periodo:", error);
      alert("Ocurrió un error al guardar el periodo.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Gestión de Periodos</h1>

      {/* Formulario de Creación/Edición */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          {editingTerm ? "Editar Periodo" : "Crear Nuevo Periodo"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Clave</label>
            <input type="text" name="key" value={formData.key} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
          </div>
          {editingTerm && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>
          )}
          <div className="md:col-span-2 flex justify-end space-x-2">
            <button type="button" onClick={handleClearForm} className="px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-white bg-green-500 hover:bg-green-600">
              {editingTerm ? "Actualizar" : "Crear"} Periodo
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Periodos */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clave</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allTerms.map((term) => (
                <tr key={term._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{term.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{term.key}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(term.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(term.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      term.status === 'active' ? 'bg-green-100 text-green-800' :
                      term.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {term.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(term)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                    <button onClick={() => handleDelete(term._id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}