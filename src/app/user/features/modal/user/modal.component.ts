import { Component, effect, input, OnInit, output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { User } from '../../user-list/user.model';
import { CommonModule } from '@angular/common';
import { RoleCombo } from '../../../../auth/features/access-system/role/role.model';
import { RoleService } from '../../../../auth/data-access/role.service';
import { employeeService } from '../../../data-access/employee.service';
import { ToolTipComponent } from '../../../../shared/ui/tool-tip/tool-tip.component';
import { BaseTokenService } from '../../../../shared/data-access/token/base-token.service';

@Component({
  selector: 'app-modal',
  imports: [CommonModule, ReactiveFormsModule, ToolTipComponent],
  templateUrl: './modal.component.html',
  styles: ``,
})

/**
 * Componente modal reutilizable para crear o editar usuarios del sistema.
 *
 * - Controlado externamente por `isOpen` y `user`.
 * - Expone eventos de `save`, `edit` y `closeModal`.
 * - Administra el formulario reactivo `userForm` con validaciones y estado.
 */
export class ModalComponent implements OnInit {
  isOpen = input<boolean>(false);
  user = input<User | null>(null);
  save = output<User>();
  edit = output<User>();
  closeModal = output<void>();
  status = true;
  userForm: FormGroup;
  roles: RoleCombo[] = [];
  filteredEmployee: any[] = [];
  isReadonly = false;
  notFoundOwner = false;
  errorMessage = '';
  notSelected = false;
  isShowingPassword = false;

  /**
   * Constructor del componente modal de usuario.
   *
   * - Inicializa el formulario reactivo `userForm` con validaciones estrictas.
   * - Configura un efecto reactivo (`effect`) que reinicia el formulario y aplica estado según el `input()` `user`.
   * - Escucha los cambios en el campo `valueFilter` para activar la búsqueda de empleados y limpiar resultados según corresponda.
   *
   * @param fb - `FormBuilder` para construir el `FormGroup`.
   * @param service - Servicio para obtener los roles disponibles (`RoleService`).
   * @param serviceEmployee - Servicio para filtrar empleados (`employeeService`).
   */
  constructor(
    private fb: FormBuilder,
    private service: RoleService,
    private serviceEmployee: employeeService,
    private token: BaseTokenService
  ) {
    this.userForm = this.fb.group({
      _id: [''],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\.,;:\-]).{8,}$/
          ),
        ],
      ],
      employee: ['', Validators.required],
      roles: ['', Validators.required],
      status: ['Activo'],
      valueFilter: ['', Validators.required],
    });

    // Efecto reactivo para sincronizar el formulario con el input `user`
    effect(() => {
      this.formReset();
      this.updateForm();
    });

    // Subscripción reactiva al input de búsqueda de empleados
    this.userForm.get('valueFilter')?.valueChanges.subscribe((value) => {
      if (!this.user()) {
        this.filterEmployee(value);
      }
      if (value === '') {
        this.cleanFilter();
      }
    });
  }
  ngOnInit() {
    this.getRoles();
  }

  /**
   * Filtra empleados desde el backend según texto ingresado.
   *
   * - Si el valor es válido (`non-empty`), activa la búsqueda.
   * - Actualiza `filteredEmployee` con resultados coincidentes.
   * - Si ocurre un error, muestra mensaje en UI (`errorMessage`) y activa bandera `notFoundOwner`.
   *
   * @param value - Texto de búsqueda (puede ser `null` o vacío).
   */
  filterEmployee(value: string | null) {
    if (value && value.trim()) {
      this.notFoundOwner = false;
      this.serviceEmployee.filter(value.trim()).subscribe(
        (res) => {
          this.filteredEmployee = res;
        },
        (error) => {
          this.notFoundOwner = true;
          this.errorMessage = error.error.message;
        }
      );
    }
  }

  /**
   * Filtra los roles que el usuario autenticado puede asignar a otros.
   *
   * - Oculta ciertos roles sensibles como "Super Admin" y "Supervision"
   *   si el usuario no tiene privilegios elevados.
   *
   * @param allRoles - Lista completa de roles disponibles.
   * @param currentUserRoles - Roles del usuario autenticado.
   * @returns Lista filtrada de roles asignables.
   */
  getAssignableRoles(
    allRoles: RoleCombo[],
    currentUserRoles: string[]
  ): RoleCombo[] {
    const RESTRICTED_ROLES = ['Super Admin', 'Supervisor'];
    const isElevated = currentUserRoles.includes('Super Admin');
    return isElevated
      ? allRoles
      : allRoles.filter((r) => !RESTRICTED_ROLES.includes(r.name));
  }

  /**
   * Obtiene la lista de roles disponibles desde el backend.
   *
   * - Asigna el resultado a la variable `roles`.
   * - En caso de error, lo imprime en consola (podrías elevar a `errorMessage` si deseas mostrarlo en UI).
   */
  getRoles() {
    this.service.combo().subscribe(
      (res) => {
        const currentUserRoles = this.token.decodedToken()?.roles || [];
        this.roles = this.getAssignableRoles(res.roles, currentUserRoles);
      },
      (error) => {
        console.log(error);
      }
    );
  }

  /**
   * Asigna un empleado seleccionado al formulario.
   *
   * - Establece el valor del campo `employee` con el `_id` del empleado.
   * - Muestra su `fullName` en el campo de búsqueda sin emitir evento.
   * - Limpia la lista `filteredEmployee` para cerrar sugerencias.
   *
   * @param subscriber - Objeto `Employee` seleccionado como propietario del usuario.
   */
  selectOwner(subscriber: any) {
    this.userForm.get('employee')?.setValue(subscriber._id);
    this.userForm
      .get('valueFilter')
      ?.setValue(subscriber.fullName, { emitEvent: false });
    this.filteredEmployee = [];
  }

  /**
   * Limpia los resultados filtrados de búsqueda de empleados.
   *
   * - Vacía `filteredEmployee`.
   * - Restaura las banderas `notFoundOwner` y `errorMessage` a su estado inicial.
   */
  cleanFilter() {
    this.filteredEmployee = [];
    this.notFoundOwner = false;
    this.errorMessage = '';
  }

  /**
   * Resetea el formulario de usuario.
   *
   * - Limpia todos los campos.
   * - Reconstruye valores por defecto o del usuario actual (`this.user()`).
   * - La línea `this.user()` sola es redundante y puede eliminarse sin afectar la funcionalidad.
   */
  formReset() {
    this.userForm.reset();
    this.user();
    this.updateForm();
  }

  /**
   * Cierra el modal y restablece el formulario.
   *
   * - Ejecuta `formReset()` para limpiar estado.
   * - Emite el evento `closeModal` al componente padre.
   */
  onClose() {
    this.formReset();
    this.closeModal.emit();
  }

  /**
   * Alterna el estado del usuario entre "Activo" e "Inactivo".
   *
   * - Invierte la bandera `status` (booleana).
   * - Actualiza el campo `status` del formulario con su valor textual correspondiente.
   */
  toggle() {
    this.status = !this.status;
    const s = this.status ? 'Activo' : 'Inactivo';
    this.userForm.get('status')?.setValue(s);
  }

  /**
   * Alterna la visibilidad del campo de contraseña (`password`).
   *
   * - Cambia la bandera `isShowingPassword`, útil para condicionar el tipo de input (`text` o `password`) en la plantilla.
   */
  togglePassword() {
    this.isShowingPassword = !this.isShowingPassword;
  }

  /**
   * Actualiza el formulario dependiendo de si hay un usuario cargado (`this.user()`).
   *
   * - Si hay usuario:
   *   - Setea `isReadonly` en `true`.
   *   - Ajusta `status` y el contenido del formulario con sus propiedades.
   * - Si no hay usuario (modo creación):
   *   - Reinicia el formulario con valores por defecto.
   *   - Marca `isReadonly` como `false`.
   */
  updateForm() {
    if (this.user()) {
      const userStatus = this.user()?.status === 'Activo';
      this.isReadonly = true;
      this.status = userStatus; // actualizamos el booleano del toggle

      this.userForm.patchValue({
        _id: this.user()?._id,
        username: this.user()?.username,
        password: this.user()?.password,
        roles: this.user()?.roles[0]._id,
        status: this.user()?.status,
        employee: this.user()?.employee._id,
        valueFilter: this.user()?.employee.fullName,
      });
    } else {
      this.isReadonly = false;
      this.status = true;
      this.userForm.reset({
        _id: '',
        username: '',
        password: '',
        employee: '',
        roles: '',
        status: 'Activo',
        valueFilter: '',
      });
    }
  }

  /**
   * Envía el formulario si es válido.
   *
   * - Clona el contenido actual del formulario reactivo (`userForm`).
   * - Si existe un usuario (`this.user()`), emite el evento `edit` con los datos.
   * - Si es un nuevo usuario, elimina la propiedad `_id` y emite `save`.
   */
  onSubmit() {
    if (this.userForm.valid) {
      const data = { ...this.userForm.value };
      if (this.user()) {
        this.edit.emit(data);
      } else {
        delete data._id;
        this.save.emit(data);
      }
    }
  }
}
